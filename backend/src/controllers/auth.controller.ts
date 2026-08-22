import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function registerHandler(req: Request, res: Response) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const result = await authService.register({ username, email, password });
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(409).json({ error: message });
  }
}

export async function loginHandler(req: Request, res: Response) {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Identifier and password are required' });
  }

  try {
    const result = await authService.initiateLogin({ identifier, password });
    res.json(result);
  } catch {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}

export async function verifyCodeHandler(req: Request, res: Response) {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ error: 'userId and code are required' });
  }

  try {
    const result = await authService.verifyLoginCode(userId, code);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    res.status(401).json({ error: message });
  }
}