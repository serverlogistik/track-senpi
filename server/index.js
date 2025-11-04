// server/index.js - Minimal API server (Node + Express)
// NOTE: This is an example development server. For production, add
// authentication, input validation, rate limiting, persistent DB, etc.
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// In-memory store (example) -> replace with DB in production
const RECORDS = [];
const LOGS = [];

app.post('/records', (req, res) => {
  try {
    const rec = Object.assign({}, req.body);
    rec.id = uuidv4();
    rec.created_at = new Date().toISOString();
    RECORDS.push(rec);
    return res.status(201).json({ id: rec.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/records', (req, res) => {
  const { nrp, action } = req.query;
  let out = RECORDS;
  if (nrp) out = out.filter(r => r.nrp == nrp);
  if (action) out = out.filter(r => r.action == action);
  return res.json(out);
});

app.post('/logs', (req, res) => {
  try {
    const log = Object.assign({}, req.body);
    log.id = uuidv4();
    log.created_at = new Date().toISOString();
    LOGS.push(log);
    return res.status(201).json({ id: log.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API server listening on ${PORT}`));