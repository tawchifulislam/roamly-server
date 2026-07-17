import { Router } from 'express';
import {
  sendMessage,
  getConversation,
} from '../controllers/chat.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.post('/', requireAuth, sendMessage);
router.get('/:id', requireAuth, getConversation);

export default router;
