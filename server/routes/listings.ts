import { Router } from 'express';
import { readDb, writeDb } from '../db.js';

export const listingsRouter = Router();

// GET all discount listings
listingsRouter.get('/listings', (req, res) => {
  try {
    const db = readDb();
    res.json(db.discountListings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST publish waste log as discount listing
listingsRouter.post('/listings', (req, res) => {
  try {
    const { logId, discountPercent, quantity, pickupTime } = req.body;
    const db = readDb();

    const log = db.wasteLogs.find(l => l.id === logId);
    if (!log) {
      return res.status(404).json({ error: 'Waste log not found' });
    }

    const menuItem = db.menuItems.find(m => m.name === log.dishName);
    const originalPrice = menuItem ? menuItem.price : 150;
    const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100));

    const restaurant = db.users.find(u => u.id === log.restaurantId);
    const lat = restaurant ? restaurant.lat : 12.9716;
    const lng = restaurant ? restaurant.lng : 77.5946;

    const id = `list-${Date.now()}`;

    const newListing = {
      id,
      logId: log.id,
      restaurantId: log.restaurantId,
      restaurantName: log.restaurantName,
      dishName: log.dishName,
      originalPrice,
      discountedPrice,
      discountPercent: Number(discountPercent),
      quantityAvailable: Number(quantity),
      quantityReserved: 0,
      pickupTime: pickupTime || '08:30 PM - 10:00 PM',
      lat,
      lng,
      imageUrl: log.imageUrl
    };

    // Update log status
    log.status = 'marketplace';

    db.discountListings.unshift(newListing);

    // Broadcast customer notification
    db.notifications.unshift({
      id: `n-${Date.now()}`,
      role: 'customer',
      title: `Flash Deal: ${log.dishName} at ${discountPercent}% OFF!`,
      message: `${log.restaurantName} has listed ${quantity} portions of ${log.dishName} at ₹${discountedPrice}.`,
      timestamp: new Date().toISOString(),
      type: 'info',
      read: false
    });

    writeDb(db);

    res.status(201).json(newListing);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
