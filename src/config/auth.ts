import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { betterAuth } from 'better-auth';

import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URI as string);
const db = client.db('roamly');

export const auth = betterAuth({
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  trustedOrigins: [process.env.CLIENT_URL as string],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
