import { Router } from 'express';
import {
  createTrip,
  deleteTrip,
  getAllTrips,
  getMyTrips,
  getTripById,
  updateTrip,
} from '../controllers/trip.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.get('/', getAllTrips);
router.get('/mine', requireAuth, getMyTrips);
router.get('/:id', getTripById);
router.post('/', requireAuth, createTrip);
router.put('/:id', requireAuth, updateTrip);
router.delete('/:id', requireAuth, deleteTrip);

export default router;
