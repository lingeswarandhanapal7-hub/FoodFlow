import { Router } from 'express';
import { readDb } from '../db.js';

export const csrReceiptsRouter = Router();

// GET all CSR receipts
csrReceiptsRouter.get('/csr-receipts', (req, res) => {
  try {
    const db = readDb();
    res.json(db.csrReceipts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
