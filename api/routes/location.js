// routes/location.js - Location tracking endpoints
const express = require('express');
const router = express.Router();
const db = require('../db');

// Save location
router.post('/', async (req, res) => {
  try {
    const { nrp, latitude, longitude, accuracy, meta } = req.body;

    if (!nrp || !latitude || !longitude) {
      return res.status(400).json({ error: 'NRP, latitude, dan longitude harus diisi' });
    }

    const result = await db.query(
      `INSERT INTO locations (nrp, latitude, longitude, accuracy, meta)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nrp, latitude, longitude, accuracy || 0, meta ? JSON.stringify(meta) : null]
    );

    // Note: WebSocket not supported in Vercel serverless
    // Frontend will poll /api/location/latest for updates

    res.json({
      success: true,
      location: result.rows[0]
    });

  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get latest locations for all users (REALTIME POLLING)
router.get('/latest', async (req, res) => {
  try {
    const { since } = req.query;
    
    let query = `SELECT * FROM latest_locations`;
    let params = [];
    
    // Support incremental updates
    if (since) {
      query += ` WHERE timestamp > $1`;
      params.push(since);
    }
    
    query += ` ORDER BY timestamp DESC`;
    
    const result = await db.query(query, params);

    // Format as object keyed by NRP (Firebase-compatible)
    const locations = {};
    result.rows.forEach(loc => {
      locations[loc.nrp] = {
        lat: parseFloat(loc.latitude),
        lng: parseFloat(loc.longitude),
        accuracy: parseFloat(loc.accuracy),
        timestamp: loc.timestamp,
        meta: loc.meta
      };
    });

    res.setHeader('Cache-Control', 'no-cache');
    res.json(locations);

  } catch (error) {
    console.error('Get latest locations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get location history for a specific user
router.get('/history/:nrp', async (req, res) => {
  try {
    const { nrp } = req.params;
    const { limit = 100 } = req.query;

    const result = await db.query(
      `SELECT * FROM locations 
       WHERE nrp = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [nrp, parseInt(limit)]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get location by NRP (single user)
router.get('/:nrp', async (req, res) => {
  try {
    const { nrp } = req.params;
    
    const result = await db.query(
      `SELECT * FROM latest_locations WHERE nrp = $1`,
      [nrp]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lokasi tidak ditemukan' });
    }

    const loc = result.rows[0];
    res.json({
      lat: parseFloat(loc.latitude),
      lng: parseFloat(loc.longitude),
      accuracy: parseFloat(loc.accuracy),
      timestamp: loc.timestamp,
      meta: loc.meta
    });

  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all recent locations (for admin tracking)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 500 } = req.query;

    const result = await db.query(
      `SELECT l.*, u.nama, u.pangkat 
       FROM locations l
       LEFT JOIN users u ON l.nrp = u.nrp
       ORDER BY l.timestamp DESC 
       LIMIT $1`,
      [parseInt(limit)]
    );

    res.setHeader('Cache-Control', 'no-cache');
    res.json(result.rows);

  } catch (error) {
    console.error('Get recent locations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete old location data (cleanup)
router.delete('/cleanup', async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await db.query(
      `DELETE FROM locations 
       WHERE timestamp < NOW() - INTERVAL '${parseInt(days)} days'
       RETURNING id`
    );

    res.json({
      success: true,
      deleted: result.rowCount,
      message: `${result.rowCount} lokasi lama berhasil dihapus`
    });

  } catch (error) {
    console.error('Cleanup locations error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
