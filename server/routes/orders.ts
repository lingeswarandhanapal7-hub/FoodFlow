import { Router } from 'express';
import { readDb, writeDb } from '../db.js';

export const ordersRouter = Router();

// GET all orders
ordersRouter.get('/orders', (req, res) => {
  try {
    const db = readDb();
    res.json(db.orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST reserve discount / create order
ordersRouter.post('/orders', (req, res) => {
  try {
    const { listingId, quantity, customerName } = req.body;
    const db = readDb();

    const listing = db.discountListings.find(l => l.id === listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.quantityAvailable < quantity) {
      return res.status(400).json({ error: 'Not enough quantity available' });
    }

    const pricePaid = listing.discountedPrice * quantity;
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    const id = `ord-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const newOrder: any = {
      id,
      listingId: listing.id,
      dishName: listing.dishName,
      restaurantName: listing.restaurantName,
      quantity: Number(quantity),
      pricePaid,
      customerName: customerName || 'Aarav Mehta',
      pickupCode,
      status: 'pending',
      date: dateStr
    };

    listing.quantityAvailable -= Number(quantity);
    listing.quantityReserved += Number(quantity);

    db.orders.unshift(newOrder);

    db.notifications.unshift({
      id: `n-${Date.now()}`,
      role: 'restaurant',
      title: 'New Order Reserved!',
      message: `${customerName || 'Aarav Mehta'} reserved ${quantity}x ${listing.dishName}. Pickup Code: #${pickupCode}`,
      timestamp: new Date().toISOString(),
      type: 'success',
      read: false
    });

    writeDb(db);

    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT complete order
ordersRouter.put('/orders/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDb();
    const order = db.orders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    order.status = 'completed';
    writeDb(db);
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
