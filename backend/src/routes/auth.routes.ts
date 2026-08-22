import { Router } from 'express';
import { registerHandler, loginHandler, verifyCodeHandler } from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/verify-code', verifyCodeHandler);

export default router;