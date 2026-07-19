import { Router } from 'express';
import {
  submitRating,
  getMyRatings,
} from '../controllers/rating.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.post('/', requireAuth, submitRating);
router.get('/mine', requireAuth, getMyRatings);

export default router;
