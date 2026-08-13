import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { RegisterInput, LoginInput, AuthPayload } from '../types/auth.types';

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '7d';

export async function register(input: RegisterInput) {
  const { username, email, password } = input;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    throw new Error('Username or email already taken');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  const token = signToken({ userId: user.id, username: user.username });

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email },
  };
}

export async function login(input: LoginInput) {
  const { identifier, password } = input;

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const token = signToken({ userId: user.id, username: user.username });

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email },
  };
}

function signToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');

  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');

  return jwt.verify(token, secret) as AuthPayload;
}