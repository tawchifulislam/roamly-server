import { Response } from 'express';
import { genAI } from '../config/gemini.js';
import Trip from '../models/Trip.js';
import ChatConversation from '../models/ChatConversation.js';
import { AuthenticatedRequest } from '../middlewares/requireAuth.js';

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, conversationId } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Find existing conversation or start a new one
    let conversation = conversationId
      ? await ChatConversation.findOne({
          _id: conversationId,
          user: req.userId,
        })
      : null;

    if (!conversation) {
      conversation = await ChatConversation.create({
        user: req.userId,
        messages: [],
      });
    }

    // Give the model a small pool of trips so it can answer platform-specific questions
    const trips = await Trip.find()
      .limit(20)
      .select('title type location price tags rating shortDescription');

    const tripContext = trips
      .map(t => `- ${t.title} (${t.type}, ${t.location}, ৳${t.price ?? 'N/A'})`)
      .join('\n');

    // Build conversation history for context-aware follow-ups
    const history = conversation.messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `You are Roamly's AI travel assistant. You help users plan trips, answer questions about listed trips, and give friendly, concise advice.

Available trips on the platform:
${tripContext}

Conversation so far:
${history || '(no previous messages)'}

User: ${message}

Reply as the Assistant. Keep the answer conversational and under 100 words. If relevant, mention specific trip titles from the list above.`;

    const result = await genAI.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    const replyText = result.text ?? "Sorry, I couldn't generate a response.";

    conversation.messages.push(
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: replyText, timestamp: new Date() },
    );
    await conversation.save();

    res.json({
      conversationId: conversation._id,
      reply: replyText,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Failed to get chat response' });
  }
};

export const getConversation = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const conversation = await ChatConversation.findOne({
      _id: id,
      user: req.userId,
    });

    if (!conversation)
      return res.status(404).json({ message: 'Conversation not found' });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversation' });
  }
};
