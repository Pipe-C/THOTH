import { Router } from 'express';
import { generateController } from '../controllers/generate.controller.js';

const router = Router();

router.post('/', generateController.generate);

export default router;
