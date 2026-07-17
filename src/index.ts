import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import connectDB from './config/db.js';
import { auth } from './config/auth.js';
import tripRoutes from './routes/trip.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import chatRoutes from './routes/chat.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.all('/api/auth/*splat', toNodeHandler(auth));
app.use(express.json());
app.use('/api/trips', tripRoutes);
connectDB();
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Roamly server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
