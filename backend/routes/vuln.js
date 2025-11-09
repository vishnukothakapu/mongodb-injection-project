const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');

// 1) NoSQL operator injection (login)
// Accepts JSON body, uses it directly in query
router.post('/login-operator-injection', async (req, res) => {
  try {
    const { username, password } = req.body || {}; // safe destructuring
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' });
    }

    // Example vulnerable query (for demo only):
    const user = await User.find({ username, password }); // findOne / find

   if (user && user.length) {
      return res.json({
        message: 'Login successful (vulnerable route)',
        user: user.username,
        id: user._id,
        matchedCount: user.length
      });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// 3) Projection injection (data exfil)
// Attacker sets ?fields=username,passwordHash or uses JSON body to control projection
router.get('/users-vuln', async (req, res) => {
// vulnerable: trusting req.query.fields directly
// Accepts comma-separated list or JSON like { fields: 'username,passwordHash' }
const fields = req.query.fields || 'username';
// naive: build projection object from string
const projection = {};
fields.split(',').forEach(f => projection[f] = 1);
const users = await User.find({}, projection).limit(50).lean().exec();
res.json(users);
});


// 3) Regex DoS / broad match
// routes/vuln.js -- vulnerable search (DEMO ONLY)
router.get('/search-vuln', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) return res.json({ count: 0, sample: [] });

    // **VULNERABLE**: constructing RegExp directly from user input (ReDoS risk)
    const rx = new RegExp(q, 'i'); // no escaping — intentionally vulnerable
    const users = await User.find({ username: rx }).limit(100).lean().exec();
    
    return res.json({ count: users.length, sample: users.slice(0, 10) });
  } catch (err) {
    console.error('search-vuln error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

// 4) $where injection (accepts JS string)
// { "where": "this.password && (function(){while(true){};})()" } -> causes DOS
router.post('/eval-vuln', async (req, res) => {
  if (process.env.ALLOW_EVAL_VULN !== '1') {
      return res.status(403).json({ ok: false, error: 'eval-vuln disabled for safety' });
    }
// expects { where: this.role=='admin'" }
const where = req.body.where;
if (!where) return res.status(400).json({ ok: false });
const users = await User.find({ $where: where }).limit(20).lean().exec();
return res.json(users);
});

router.post('/aggregate-vuln', async (req, res) => {
  try {
    const pipeline = req.body.pipeline;
    if (!Array.isArray(pipeline)) return res.status(400).json({ error: 'pipeline must be an array' });

    // executing user-supplied pipeline 
    const coll = mongoose.connection.db.collection('users');
    const cursor = coll.aggregate(pipeline, { allowDiskUse: false });
    const out = await cursor.limit(100).toArray();
    return res.json({ count: out.length, results: out.slice(0, 20) });
  } catch (err) {
    console.error('aggregate-vuln error', err);
    return res.status(500).json({ error: 'server error' });
  }
});


module.exports = router;