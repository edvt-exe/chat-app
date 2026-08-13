import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function registerHandler(req: Request, res: Response) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
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
    const result = await authService.login({ identifier, password });
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}