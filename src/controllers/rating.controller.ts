import { Response } from 'express';
import mongoose from 'mongoose';
import Rating from '../models/Rating.js';
import Trip from '../models/Trip.js';
import { AuthenticatedRequest } from '../middlewares/requireAuth.js';

export const submitRating = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { tripId, value } = req.body;

    if (!tripId || !value || value < 1 || value > 5) {
      return res
        .status(400)
        .json({ message: 'A trip and a rating between 1-5 are required' });
    }

    // Upsert: creates a new rating, or updates this user's existing one for the same trip
    await Rating.findOneAndUpdate(
      { trip: tripId, user: req.userId },
      { value },
      { upsert: true, new: true },
    );

    const stats = await Rating.aggregate([
      { $match: { trip: new mongoose.Types.ObjectId(tripId) } },
      { $group: { _id: '$trip', avg: { $avg: '$value' } } },
    ]);

    const avgRating = stats[0]?.avg ?? value;

    const trip = await Trip.findByIdAndUpdate(
      tripId,
      { rating: Math.round(avgRating * 10) / 10 },
      { new: true },
    );

    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    res.json({ message: 'Rating submitted', rating: trip.rating });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
};

export const getMyRatings = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const ratings = await Rating.find({ user: req.userId });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your ratings' });
  }
};
