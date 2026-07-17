import { Response } from 'express';
import { genAI } from '../config/gemini.js';
import Trip from '../models/Trip.js';
import RecommendationLog from '../models/RecommendationLog.js';
import { AuthenticatedRequest } from '../middlewares/requireAuth.js';

export const getRecommendations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { interests, budgetRange } = req.body;

    // Pull a reasonable pool of trips to let the model choose from
    const trips = await Trip.find()
      .limit(30)
      .select('title type location price tags rating shortDescription');

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
    }));

    const prompt = `You are a travel recommendation engine for Roamly, a travel platform.

User preferences:
- Interests: ${interests?.join(', ') || 'not specified'}
- Budget range: ${budgetRange || 'not specified'}

Available trips (JSON):
${JSON.stringify(tripSummaries)}

Task: Select the 5 best matching trips for this user based on their interests and budget.
Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{
  "recommendations": [
    { "id": "trip_id_here", "reason": "one short sentence explaining why this fits" }
  ]
}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawText = result.text ?? '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Attach full trip details to each recommendation
    const recommendedTrips = parsed.recommendations
      .map((rec: { id: string; reason: string }) => {
        const trip = trips.find(t => t._id.toString() === rec.id);
        return trip ? { trip, reason: rec.reason } : null;
      })
      .filter(Boolean);

    // Log this recommendation for future improvement
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
