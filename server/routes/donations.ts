import { Router } from 'express';
import { readDb, writeDb } from '../db.js';

export const donationsRouter = Router();

// GET all donations
donationsRouter.get('/donations', (req, res) => {
  try {
    const db = readDb();
    res.json(db.donations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create donation
donationsRouter.post('/donations', (req, res) => {
  try {
    const { logId, listingId, ngoId } = req.body;
    const db = readDb();

    let log: any;
    if (logId) {
      log = db.wasteLogs.find(l => l.id === logId);
    } else if (listingId) {
      const listing = db.discountListings.find(l => l.id === listingId);
      if (listing) {
        log = db.wasteLogs.find(l => l.id === listing.logId);
      }
    }

    if (!log) {
      return res.status(404).json({ error: 'Log or listing source not found' });
    }

    const ngo = db.users.find(u => u.id === (ngoId || 'u-ngo-1'));
    const ngoName = ngo ? ngo.name : 'Hope Food Shelter';
    const ngoLat = ngo ? ngo.lat : 12.9352;
    const ngoLng = ngo ? ngo.lng : 77.6245;

    const restaurant = db.users.find(u => u.id === log.restaurantId);
    const restaurantLat = restaurant ? restaurant.lat : 12.9716;
    const restaurantLng = restaurant ? restaurant.lng : 77.5946;

    const id = `don-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const newDonation: any = {
      id,
      restaurantId: log.restaurantId,
      restaurantName: log.restaurantName,
      ngoId: ngo ? ngo.id : 'u-ngo-1',
      ngoName,
      dishName: log.dishName,
      quantity: log.quantityLeft,
      weight: log.weightOfWaste,
      expiryTime: log.expiryTime,
      status: 'pending',
      date: dateStr,
      restaurantLat,
      restaurantLng,
      ngoLat,
      ngoLng
    };

    log.status = 'donated';
    db.donations.unshift(newDonation);

    db.notifications.unshift({
      id: `n-${Date.now()}`,
      role: 'ngo',
      title: 'New Donation Request',
      message: `${log.restaurantName} offered ${log.quantityLeft} portions (${log.weightOfWaste} kg) of ${log.dishName} to ${ngoName}.`,
      timestamp: new Date().toISOString(),
      type: 'warning',
      read: false
    });

    writeDb(db);

    res.status(201).json(newDonation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update donation status
donationsRouter.put('/donations/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const db = readDb();

    const donation = db.donations.find(d => d.id === id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    donation.status = status;

    // If completed, issue CSR receipt
    if (status === 'completed') {
      const existingReceipt = db.csrReceipts.find(r => r.donationId === id);
      if (!existingReceipt) {
        const receiptId = `csr-${Date.now()}`;
        const estimatedMeals = Math.round(donation.weight * 3);
        const carbonSaved = Number((donation.weight * 2.5).toFixed(1));
        const signature = `SIG-${Math.random().toString(36).substring(2, 10).toUpperCase()}-FOODFLOW-CSR`;

        db.csrReceipts.unshift({
          id: receiptId,
          donationId: id,
          restaurantName: donation.restaurantName,
          ngoName: donation.ngoName,
          date: new Date().toISOString().split('T')[0],
          dishName: donation.dishName,
          weight: donation.weight,
          estimatedMeals,
          carbonSaved,
          signature
        });

        db.notifications.unshift({
          id: `n-${Date.now()}`,
          role: 'restaurant',
          title: 'CSR Impact Receipt Issued!',
          message: `CSR receipt #${receiptId} generated for ${donation.dishName} donation to ${donation.ngoName}.`,
          timestamp: new Date().toISOString(),
          type: 'success',
          read: false
        });
      }
    }

    writeDb(db);

    res.json(donation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
