import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${err.message}`, err.stack);
  const status = (err as any).status || 500;
  const message = err.message || 'Erreur interne du serveur';
  res.status(status).json({ error: message });
}