// routes/users.js - User management endpoints
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Get all users (with their senpi)
router.get('/', async (req, res) => {
  try {
    const pool = req.app.get('db');
    
    // Get all users
    const usersResult = await pool.query(
      `SELECT nrp, nama, pangkat, kesatuan, status, created_at 
       FROM users 
       ORDER BY nama`
    );

    // Get all senpi grouped by NRP
    const senpiResult = await pool.query(
      `SELECT * FROM senpi ORDER BY nrp, nomor_seri`
    );

    // Group senpi by NRP
    const senpiByNrp = {};
    senpiResult.rows.forEach(s => {
      if (!senpiByNrp[s.nrp]) senpiByNrp[s.nrp] = [];
      senpiByNrp[s.nrp].push({
        nomor_seri: s.nomor_seri,
        jenis: s.jenis,
        keterangan: s.keterangan,
        tanggal_terbit_simsa: s.tanggal_terbit_simsa,
        tanggal_expired: s.tanggal_expired,
        foto_simsa: s.foto_simsa,
        foto_senpi: s.foto_senpi
      });
    });

    // Build response in Firebase-compatible format
    const users = {};
    usersResult.rows.forEach(user => {
      users[user.nrp] = {
        nama: user.nama,
        pangkat: user.pangkat,
        kesatuan: user.kesatuan,
        status: user.status,
        senpi: senpiByNrp[user.nrp] || []
      };
    });

    res.json(users);

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single user by NRP
router.get('/:nrp', async (req, res) => {
  try {
    const { nrp } = req.params;
    const pool = req.app.get('db');

    const userResult = await pool.query(
      'SELECT * FROM users WHERE nrp = $1',
      [nrp]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const senpiResult = await pool.query(
      'SELECT * FROM senpi WHERE nrp = $1',
      [nrp]
    );

    const user = userResult.rows[0];
    res.json({
      nrp: user.nrp,
      nama: user.nama,
      pangkat: user.pangkat,
      kesatuan: user.kesatuan,
      status: user.status,
      senpi: senpiResult.rows
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { nrp, nama, pangkat, kesatuan, password } = req.body;

    if (!nrp || !nama) {
      return res.status(400).json({ error: 'NRP dan nama harus diisi' });
    }

    const pool = req.app.get('db');

    // Check if NRP already exists
    const existing = await pool.query('SELECT nrp FROM users WHERE nrp = $1', [nrp]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'NRP sudah terdaftar' });
    }

    // Hash password (default: nrp itself)
    const passwordHash = password ? 
      await bcrypt.hash(password, 10) : 
      await bcrypt.hash(nrp, 10);

    const result = await pool.query(
      `INSERT INTO users (nrp, nama, pangkat, kesatuan, password_hash, status)
       VALUES ($1, $2, $3, $4, $5, 'Aktif')
       RETURNING *`,
      [nrp, nama, pangkat || '', kesatuan || '', passwordHash]
    );

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:nrp', async (req, res) => {
  try {
    const { nrp } = req.params;
    const { nama, pangkat, kesatuan, status } = req.body;

    const pool = req.app.get('db');

    const result = await pool.query(
      `UPDATE users 
       SET nama = COALESCE($1, nama),
           pangkat = COALESCE($2, pangkat),
           kesatuan = COALESCE($3, kesatuan),
           status = COALESCE($4, status)
       WHERE nrp = $5
       RETURNING *`,
      [nama, pangkat, kesatuan, status, nrp]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:nrp', async (req, res) => {
  try {
    const { nrp } = req.params;
    const pool = req.app.get('db');

    const result = await pool.query(
      'DELETE FROM users WHERE nrp = $1 RETURNING *',
      [nrp]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'User berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk update - replace entire users data (Firebase migration compatibility)
router.post('/bulk-update', async (req, res) => {
  try {
    const usersData = req.body;
    const pool = req.app.get('db');

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const nrp in usersData) {
        const user = usersData[nrp];
        
        // Upsert user
        await client.query(
          `INSERT INTO users (nrp, nama, pangkat, kesatuan, status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (nrp) DO UPDATE
           SET nama = $2, pangkat = $3, kesatuan = $4, status = $5`,
          [nrp, user.nama, user.pangkat, user.kesatuan, user.status || 'Aktif']
        );

        // Delete existing senpi for this user
        await client.query('DELETE FROM senpi WHERE nrp = $1', [nrp]);

        // Insert senpi
        if (user.senpi && Array.isArray(user.senpi)) {
          for (const s of user.senpi) {
            await client.query(
              `INSERT INTO senpi (nrp, nomor_seri, jenis, keterangan, tanggal_terbit_simsa, tanggal_expired, foto_simsa, foto_senpi)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (nomor_seri) DO UPDATE
               SET nrp = $1, jenis = $3, keterangan = $4, tanggal_terbit_simsa = $5, tanggal_expired = $6, foto_simsa = $7, foto_senpi = $8`,
              [
                nrp,
                s.nomor_seri,
                s.jenis,
                s.keterangan,
                s.tanggal_terbit_simsa || null,
                s.tanggal_expired || null,
                s.foto_simsa || null,
                s.foto_senpi || null
              ]
            );
          }
        }
      }

      await client.query('COMMIT');
      
      res.json({ success: true, message: 'Bulk update berhasil' });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
