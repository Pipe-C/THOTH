import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import vectorSearchRoutes from './vectorSearch.routes.js';
import generateRoutes from './generate.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/vector-search', vectorSearchRoutes);
router.use('/generate', generateRoutes);

export default router;
