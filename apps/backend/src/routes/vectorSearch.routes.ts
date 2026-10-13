import { Router } from 'express';
import { vectorSearchController } from '../controllers/vectorSearch.controller.js';

const router = Router();

router.post('/', vectorSearchController.search);

export default router;
