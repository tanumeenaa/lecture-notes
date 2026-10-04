import { z } from 'zod';
import { User } from '../models/User.js';
import { createToken, hashPassword, verifyPassword } from '../utils/auth.js';

const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export async function signup(req, res) {
  const input = signupSchema.parse(req.body);
  const email = input.email.toLowerCase();
  if (await User.exists({ email })) return res.status(409).json({ message: 'An account with that email already exists.' });
  const user = await User.create({ name: input.name, email, passwordHash: await hashPassword(input.password) });
  res.status(201).json({ token: createToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
}

export async function login(req, res) {
  const input = loginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  res.json({ token: createToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
}

export async function currentUser(req, res) {
  const user = await User.findById(req.userId).select('name email');
  if (!user) return res.status(401).json({ message: 'Your account is no longer available.' });
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
}