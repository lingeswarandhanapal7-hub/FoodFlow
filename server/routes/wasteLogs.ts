import { Router } from 'express';
import { readDb, writeDb } from '../db.js';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';

export const wasteLogsRouter = Router();

// GET waste logs
wasteLogsRouter.get('/waste-logs', (req, res) => {
  try {
    const db = readDb();
    res.json(db.wasteLogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST new waste log
wasteLogsRouter.post('/waste-logs', optionalAuth, (req: AuthRequest, res) => {
  try {
    const {
      restaurantId,
      restaurantName,
      dishName,
      category,
      quantityPrepared,
      quantitySold,
      quantityLeft,
      weightOfWaste,
      wasteReason,
      date,
      weather,
      festival,
      dayOfWeek,
      expiryTime,
      imageUrl
    } = req.body;

    const db = readDb();
    const id = `log-${Date.now()}`;

    const newLog: any = {
      id,
      restaurantId: req.user?.id || restaurantId || 'u-rest-1',
      restaurantName: restaurantName || req.user?.name || 'Spice Garden',
      dishName,
      category,
      quantityPrepared: Number(quantityPrepared),
      quantitySold: Number(quantitySold),
      quantityLeft: Number(quantityLeft),
      weightOfWaste: Number(weightOfWaste),
      wasteReason,
      date: date || new Date().toISOString().split('T')[0],
      weather: weather || 'Clear',
      festival: festival || 'None',
      dayOfWeek: dayOfWeek || 'Today',
      expiryTime: expiryTime || '10:00 PM',
      status: 'logged',
      imageUrl: imageUrl || '/images/masala_dosa.png'
    };

    db.wasteLogs.unshift(newLog);
    writeDb(db);

    res.status(201).json(newLog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
