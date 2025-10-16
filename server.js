const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple file-based DB helpers (db.json)
const dbFile = path.join(__dirname, 'db.json');

async function readDB() {
  try {
    const txt = await fs.readFile(dbFile, 'utf8');
    return JSON.parse(txt || '{}');
  } catch (err) {
    if (err.code === 'ENOENT') return { users: [], codes: [] };
    throw err;
  }
}

async function writeDB(data) {
  await fs.writeFile(dbFile, JSON.stringify(data, null, 2), 'utf8');
}

async function initDB() {
  const data = await readDB();
  data.users = data.users || [];
  data.codes = data.codes || [];
  data.cooldowns = data.cooldowns || {};
  await writeDB(data);
}

initDB();

// Simple in-memory cooldown tracker: phone -> timestamp when allowed
const cooldowns = new Map();

// Generate a 6-digit code for demo purposes
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/api/send-code', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });

  const now = Date.now();

  // read persisted cooldowns
  const data = await readDB();
  data.cooldowns = data.cooldowns || {};
  const allowedAt = data.cooldowns[phone] || 0;
  if (now < allowedAt) {
    const wait = Math.ceil((allowedAt - now) / 1000);
    return res.status(429).json({ error: 'wait', wait });
  }

  const code = generateCode();
  const id = nanoid();

  data.codes.push({ id, phone, code, createdAt: Date.now() });
  // upsert user
  let user = data.users.find(u => u.phone === phone);
  if (!user) {
    user = { id: nanoid(), phone, createdAt: Date.now(), verified: false };
    data.users.push(user);
  }

  // set cooldown: 60 seconds and persist it
  data.cooldowns[phone] = now + 60 * 1000;

  await writeDB(data);

  console.log(`Sending code ${code} to ${phone} (demo)`);

  res.json({ ok: true, wait: 60 });
});

app.post('/api/verify-code', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });

  const data = await readDB();
  const found = data.codes.find(c => c.phone === phone && c.code === code);
  if (!found) return res.status(400).json({ error: 'invalid code' });

  // mark user as verified
  const user = data.users.find(u => u.phone === phone);
  if (user) user.verified = true;
  await writeDB(data);

  res.json({ ok: true });
});

app.post('/api/set-password', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'phone and password required' });

  const data = await readDB();
  const user = data.users.find(u => u.phone === phone);
  if (!user) return res.status(404).json({ error: 'user not found' });

  const hash = bcrypt.hashSync(password, 8);
  user.passwordHash = hash;
  user.completedAt = Date.now();
  await writeDB(data);

  res.json({ ok: true });
});

app.get('/api/db', async (req, res) => {
  const data = await readDB();
  res.json(data);
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
