// routes/senpi.js - Senpi management endpoints
const express = require('express');
const router = express.Router();

// Get all senpi with user details
router.get('/', async (req, res) => {
  try {
    const pool = req.app.get('db');
    
    const result = await pool.query(
      `SELECT * FROM senpi_with_users ORDER BY nomor_seri`
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get senpi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get senpi by NRP
router.get('/user/:nrp', async (req, res) => {
  try {
    const { nrp } = req.params;
    const pool = req.app.get('db');

    const result = await pool.query(
      'SELECT * FROM senpi WHERE nrp = $1',
      [nrp]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Get senpi by NRP error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new senpi
router.post('/', async (req, res) => {
  try {
    const { 
      nomor_seri, 
      nrp, 
      jenis, 
      keterangan,
      tanggal_terbit_simsa,
      tanggal_expired,
      foto_simsa,
      foto_senpi
    } = req.body;

    if (!nomor_seri || !nrp) {
      return res.status(400).json({ error: 'Nomor seri dan NRP harus diisi' });
    }

    const pool = req.app.get('db');

    // Check if nomor_seri already exists
    const existing = await pool.query(
      'SELECT nomor_seri FROM senpi WHERE nomor_seri = $1',
      [nomor_seri]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Nomor seri sudah terdaftar' });
    }

    const result = await pool.query(
      `INSERT INTO senpi (nomor_seri, nrp, jenis, keterangan, tanggal_terbit_simsa, tanggal_expired, foto_simsa, foto_senpi)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        nomor_seri,
        nrp,
        jenis || '',
        keterangan || '',
        tanggal_terbit_simsa || null,
        tanggal_expired || null,
        foto_simsa || null,
        foto_senpi || null
      ]
    );

    // Broadcast update via WebSocket
    const wss = req.app.get('wss');
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'senpi_created',
          data: result.rows[0]
        }));
      }
    });

    res.json({
      success: true,
      senpi: result.rows[0]
    });

  } catch (error) {
    console.error('Create senpi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update senpi
router.put('/:nomor_seri', async (req, res) => {
  try {
    const { nomor_seri } = req.params;
    const { 
      jenis, 
      keterangan,
      tanggal_terbit_simsa,
      tanggal_expired,
      foto_simsa,
      foto_senpi
    } = req.body;

    const pool = req.app.get('db');

    const result = await pool.query(
      `UPDATE senpi 
       SET jenis = COALESCE($1, jenis),
           keterangan = COALESCE($2, keterangan),
           tanggal_terbit_simsa = COALESCE($3, tanggal_terbit_simsa),
           tanggal_expired = COALESCE($4, tanggal_expired),
           foto_simsa = COALESCE($5, foto_simsa),
           foto_senpi = COALESCE($6, foto_senpi)
       WHERE nomor_seri = $7
       RETURNING *`,
      [jenis, keterangan, tanggal_terbit_simsa, tanggal_expired, foto_simsa, foto_senpi, nomor_seri]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Senpi tidak ditemukan' });
    }

    // Broadcast update via WebSocket
    const wss = req.app.get('wss');
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'senpi_updated',
          data: result.rows[0]
        }));
      }
    });

    res.json({
      success: true,
      senpi: result.rows[0]
    });

  } catch (error) {
    console.error('Update senpi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Assign/transfer senpi to another user
router.post('/:nomor_seri/assign', async (req, res) => {
  try {
    const { nomor_seri } = req.params;
    const { new_nrp } = req.body;

    if (!new_nrp) {
      return res.status(400).json({ error: 'NRP baru harus diisi' });
    }

    const pool = req.app.get('db');

    // Check if new NRP exists
    const userCheck = await pool.query('SELECT nrp FROM users WHERE nrp = $1', [new_nrp]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'NRP tujuan tidak ditemukan' });
    }

    const result = await pool.query(
      `UPDATE senpi SET nrp = $1 WHERE nomor_seri = $2 RETURNING *`,
      [new_nrp, nomor_seri]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Senpi tidak ditemukan' });
    }

    // Log the transfer
    await pool.query(
      `INSERT INTO admin_logs (action, details)
       VALUES ('senpi_transfer', $1)`,
      [JSON.stringify({ nomor_seri, new_nrp, timestamp: new Date() })]
    );

    res.json({
      success: true,
      senpi: result.rows[0]
    });

  } catch (error) {
    console.error('Assign senpi error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete senpi
router.delete('/:nomor_seri', async (req, res) => {
  try {
    const { nomor_seri } = req.params;
    const pool = req.app.get('db');

    const result = await pool.query(
      'DELETE FROM senpi WHERE nomor_seri = $1 RETURNING *',
      [nomor_seri]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Senpi tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Senpi berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete senpi error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
