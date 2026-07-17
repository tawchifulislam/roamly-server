import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('Roamly server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
