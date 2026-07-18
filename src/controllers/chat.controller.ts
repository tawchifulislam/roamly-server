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

    const trips = await Trip.find()
      .limit(20)
      .select('title type location price tags rating shortDescription');

    const tripContext = trips
      .map(t => `- ${t.title} (${t.type}, ${t.location}, ৳${t.price ?? 'N/A'})`)
      .join('\n');

    const history = conversation.messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `You are Roamly's AI travel assistant. You help users plan trips, answer questions about listed trips, and give friendly, concise advice.

Available trips on the platform:
${tripContext}

Conversation so far:
${history || '(no previous messages)'}

User: ${message}

Reply as the Assistant. Keep the answer conversational and under 100 words. If relevant, mention specific trip titles from the list above.

After your reply, suggest exactly 3 short follow-up questions the user might naturally ask next, based on this reply.

Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{
  "reply": "your reply text here",
  "followUps": ["question 1", "question 2", "question 3"]
}`;

    const result = await genAI.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    const rawText = result.text ?? '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let replyText = "Sorry, I couldn't generate a response.";
    let followUps: string[] = [];

    try {
      const parsed = JSON.parse(cleaned);
      replyText = parsed.reply ?? replyText;
      followUps = Array.isArray(parsed.followUps)
        ? parsed.followUps.slice(0, 3)
        : [];
    } catch {
      // Fallback: if Gemini didn't return valid JSON, use raw text as reply with no follow-ups
      replyText = rawText;
    }

    conversation.messages.push(
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'assistant', content: replyText, timestamp: new Date() },
    );
    await conversation.save();

    res.json({
      conversationId: conversation._id,
      reply: replyText,
      followUps,
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
