import { Response } from 'express';
import Trip from '../models/Trip.js';
import { AuthenticatedRequest } from '../middlewares/requireAuth.js';

export const getAllTrips = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      type,
      location,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 8,
    } = req.query;

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {
        ...(minPrice && { $gte: Number(minPrice) }),
        ...(maxPrice && { $lte: Number(maxPrice) }),
      };
    }

    const sortOption: Record<string, 1 | -1> =
      sort === 'price_asc'
        ? { price: 1 }
        : sort === 'price_desc'
          ? { price: -1 }
          : sort === 'rating'
            ? { rating: -1 }
            : { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [trips, total] = await Promise.all([
      Trip.find(filter).sort(sortOption).skip(skip).limit(Number(limit)),
      Trip.countDocuments(filter),
    ]);

    res.json({
      trips,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trips' });
  }
};

export const getTripById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch trip' });
  }
};

export const getMyTrips = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trips = await Trip.find({ createdBy: req.userId }).sort({
      createdAt: -1,
    });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your trips' });
  }
};

export const createTrip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trip = await Trip.create({ ...req.body, createdBy: req.userId });
    res.status(201).json(trip);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create trip' });
  }
};

export const updateTrip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      req.body,
      { new: true },
    );
    if (!trip)
      return res.status(404).json({ message: 'Trip not found or not yours' });
    res.json(trip);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update trip' });
  }
};

export const deleteTrip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trip = await Trip.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId,
    });
    if (!trip)
      return res.status(404).json({ message: 'Trip not found or not yours' });
    res.json({ message: 'Trip deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete trip' });
  }
};
