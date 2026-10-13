import express, { Request, Response, NextFunction } from 'express';
import apiRouter from './routes/index.js';
import { sendError, ErrorCode } from '../lib/response.js';

const app = express();

app.use(express.json());

// Mount API v1 router
app.use('/api/v1', apiRouter);

// Fallback route handling for 404
app.use((_req: Request, res: Response) => {
  sendError(
    res as any,
    404,
    ErrorCode.NOT_FOUND,
    'La ruta solicitada no fue encontrada.',
  );
});

// Global Error Handler Middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  sendError(
    res as any,
    500,
    ErrorCode.INTERNAL_ERROR,
    'Error no controlado en la aplicación.',
    err.message,
  );
});

export default app;
