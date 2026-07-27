import { Router } from 'express';
import { readDb, writeDb } from '../db.js';

export const notificationsRouter = Router();

// GET notifications (optionally filtered by role)
notificationsRouter.get('/notifications', (req, res) => {
  try {
    const { role } = req.query;
    const db = readDb();
    let notifs = db.notifications;

    if (role && role !== 'all') {
      notifs = notifs.filter(n => n.role === role || n.role === 'all');
    }

    res.json(notifs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST add notification
notificationsRouter.post('/notifications', (req, res) => {
  try {
    const { role, title, message, type } = req.body;
    const db = readDb();
    const id = `n-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newNotif = {
      id,
      role: role || 'all',
      title,
      message,
      timestamp,
      type: type || 'info',
      read: false
    };

    db.notifications.unshift(newNotif);
    writeDb(db);

    res.status(201).json(newNotif);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT mark notification as read
notificationsRouter.put('/notifications/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const notif = db.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      writeDb(db);
    }
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
