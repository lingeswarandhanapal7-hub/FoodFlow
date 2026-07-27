import { Router } from 'express';
import { readDb, writeDb } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

export const menuRouter = Router();

// GET menu items
menuRouter.get('/menu', (req, res) => {
  try {
    const db = readDb();
    res.json(db.menuItems);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST add menu item (Protected)
menuRouter.post('/menu', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { name, category, price, description, imageUrl } = req.body;
    const db = readDb();
    const id = `m-${Date.now()}`;

    const newItem = {
      id,
      name,
      category,
      price: Number(price),
      description,
      imageUrl: imageUrl || '/images/masala_dosa.png'
    };

    db.menuItems.push(newItem);
    writeDb(db);

    res.status(201).json(newItem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE menu item (Protected)
menuRouter.delete('/menu/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    db.menuItems = db.menuItems.filter(item => item.id !== id);
    writeDb(db);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
