import dotenv from 'dotenv';
import { z } from 'zod';
import { validateProductionEnvironment } from './productionEnv.js';

dotenv.config();

validateProductionEnvironment(process.env);

const defaultSecret = process.env.NODE_ENV === 'production' ? undefined : 'development-secret-change-before-deploy';

const schema = z.object({
  PORT: z.coerce.number().default(5003),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/lecture-notes'),
  JWT_SECRET: z.string().min(24),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  CLIENT_URL: z.string().default('http://localhost:5175'),
  CLOUDINARY_URL: z.string().optional().default('')
});

export const env = schema.parse({ ...process.env, JWT_SECRET: process.env.JWT_SECRET ?? defaultSecret });