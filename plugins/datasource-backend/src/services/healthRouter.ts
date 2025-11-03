import express, { Router } from 'express';

export async function createHealthRouter(): Promise<express.Router> {
  const router = Router();

  router.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok' });
    return;
  });

  return router;
}
