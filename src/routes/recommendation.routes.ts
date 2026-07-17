import { Router } from 'express';
import { getRecommendations } from '../controllers/recommendation.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.post('/', requireAuth, getRecommendations);

export default router;
