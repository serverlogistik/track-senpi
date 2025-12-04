// routes/auth.js - Authentication endpoints
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { nrp, password } = req.body;

    if (!nrp || !password) {
      return res.status(400).json({ error: 'NRP dan password harus diisi' });
    }

    const pool = req.app.get('db');
    
    // Get user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE nrp = $1',
      [nrp]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'NRP tidak ditemukan' });
    }

    const user = userResult.rows[0];

    // For development: allow password-less login or default password
    let isValidPassword = false;
    if (user.password_hash) {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    } else {
      // Default password if not set (for migration)
      isValidPassword = password === 'polri2024' || password === user.nrp;
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Password salah' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        nrp: user.nrp, 
        nama: user.nama,
        isAdmin: user.is_admin 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create session
    await pool.query(
      `INSERT INTO sessions (nrp, login_time, last_active, status, device_info)
       VALUES ($1, NOW(), NOW(), 'active', $2)`,
      [nrp, JSON.stringify(req.headers)]
    );

    // Return user data
    res.json({
      success: true,
      token,
      user: {
        nrp: user.nrp,
        nama: user.nama,
        pangkat: user.pangkat,
        kesatuan: user.kesatuan,
        isAdmin: user.is_admin,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login gagal: ' + error.message });
  }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token tidak ditemukan' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const pool = req.app.get('db');
    const userResult = await pool.query(
      'SELECT nrp, nama, pangkat, kesatuan, is_admin, status FROM users WHERE nrp = $1',
      [decoded.nrp]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }

    res.json({
      valid: true,
      user: userResult.rows[0]
    });

  } catch (error) {
    res.status(401).json({ error: 'Token invalid atau expired' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { nrp } = req.body;
    
    if (nrp) {
      const pool = req.app.get('db');
      await pool.query(
        `UPDATE sessions SET status = 'logged_out', last_active = NOW() 
         WHERE nrp = $1 AND status = 'active'`,
        [nrp]
      );
    }

    res.json({ success: true, message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout gagal' });
  }
});

module.exports = router;
