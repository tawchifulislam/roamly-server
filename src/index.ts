import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';
import connectDB from './config/db.js';
import { auth } from './config/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Better Auth handles its own routes under /api/auth/*
// This must be registered BEFORE express.json() middleware
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('Roamly server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
