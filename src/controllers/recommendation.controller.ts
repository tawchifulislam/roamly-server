import { Response } from 'express';
import { genAI } from '../config/gemini.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import RecommendationLog from '../models/RecommendationLog.js';
import { AuthenticatedRequest } from '../middlewares/requireAuth.js';

export const getRecommendations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { interests, budgetRange } = req.body;

    // Merge new interests into the user's stored preferences (accumulates over time)
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const mergedInterests = Array.from(
      new Set([...(user.preferences?.interests ?? []), ...(interests ?? [])]),
    );

    user.preferences = {
      interests: mergedInterests,
      budgetRange: budgetRange || user.preferences?.budgetRange || 'medium',
    };
    await user.save();

    // Pull trip pool
    const trips = await Trip.find()
      .limit(30)
      .select('title type location price tags rating shortDescription images');

    if (trips.length === 0) {
      return res
        .status(404)
        .json({ message: 'No trips available to recommend from' });
    }

    const tripSummaries = trips.map(t => ({
      id: t._id.toString(),
      title: t.title,
      type: t.type,
      location: t.location,
      price: t.price ?? 'N/A',
      tags: t.tags,
      rating: t.rating,
      description: t.shortDescription,
    }));

    // Pull the last 5 recommendation logs to see what's already been shown
    const pastLogs = await RecommendationLog.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('generatedRecommendations', 'title');

    const previouslyRecommendedTitles = Array.from(
      new Set(
        pastLogs.flatMap(log =>
          (log.generatedRecommendations as unknown as { title: string }[]).map(
            t => t.title,
          ),
        ),
      ),
    );

    const prompt = `You are a travel recommendation engine for Roamly, a travel platform.

User's accumulated preferences (built up over multiple sessions):
- Interests: ${mergedInterests.join(', ') || 'not specified'}
- Budget range: ${user.preferences.budgetRange}

Trips already recommended to this user in past sessions (avoid repeating these unless they are a strong match and nothing better fits):
${previouslyRecommendedTitles.length > 0 ? previouslyRecommendedTitles.join(', ') : '(none yet)'}

Available trips (JSON):
${JSON.stringify(tripSummaries)}

Task: Select the 5 best matching trips for this user based on their accumulated interests and budget.
Prioritize variety - if the user has seen a trip before, only include it again if it's clearly the best match.
Use the title, description, and location to judge relevance even if tags are missing or sparse.
Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{
  "recommendations": [
    { "id": "trip_id_here", "reason": "one short sentence explaining why this fits" }
  ]
}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    const rawText = result.text ?? '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const recommendedTrips = parsed.recommendations
      .map((rec: { id: string; reason: string }) => {
        const trip = trips.find(t => t._id.toString() === rec.id);
        return trip ? { trip, reason: rec.reason } : null;
      })
      .filter(Boolean);

    await RecommendationLog.create({
      user: req.userId,
      generatedRecommendations: recommendedTrips.map(
        (r: { trip: { _id: unknown } }) => r.trip._id,
      ),
    });

    res.json({ recommendations: recommendedTrips });
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
};
