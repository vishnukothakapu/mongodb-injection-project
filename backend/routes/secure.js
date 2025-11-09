// routes/secure.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Joi = require('joi');
const sanitizeString = require('../utils/sanitize');
const bcrypt = require('bcrypt');


const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(3).max(128).required()
});
router.post('/login-secure', async (req, res) => {
  // Validate shape
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ ok: false, err: 'Invalid input' });

  // Sanitize (remove $ and . keys)
  const username = sanitizeString(value.username);
  const password = value.password;

  try {
    const user = await User.findOne({ username }).select('+password');
    if (!user) return res.status(401).json({ ok: false });

    // password hash comparison
    // const ok = await bcrypt.compare(password, user.password);
    // if (!ok) return res.status(401).json({ ok: false });


    res.json({ ok: true, user: { username: user.username, id: user._id } });
  } catch (err) {
    console.error('login-secure error', err);
    res.status(500).json({ ok: false, err: 'Internal server error' });
  }
});


// Secure projection endpoint: whitelist fields and ignore user-supplied raw projection
router.get('/users-secure', async (req, res) => {
  try {
    const allowed = new Set(['username']); // username,email
    const requested = String(req.query.fields || 'username').split(',').map(f => f.trim()).filter(Boolean);
    const fields = requested.filter(f => allowed.has(f));
    if (fields.length === 0) return res.status(400).json({ error: 'no allowed fields requested' });
    const projection = {};
    fields.forEach(f => projection[f] = 1);
    const users = await User.find({}, projection).limit(10).lean().exec(); // limit to 10 results
    res.json(users);
  } catch (err) {
    console.error('users-secure error', err);
    res.status(500).json({ error: 'Server error' });
  }

});


// Secure search: escape regex metacharacters or use text indexes / exact prefixes
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/search-secure', async (req, res) => {
  try {
    // sanitize raw input (remove $ and . if present)
    const raw = sanitizeString(String(req.query.q || '')).trim();
    // basic validation / limits
    if (!raw) return res.json({ count: 0, users: [] });;

    // escape regex special characters and use anchored prefix search (safer)
    const esc = escapeRegex(raw);
    const rx = new RegExp('^' + esc, 'i'); // '^' for prefix; remove '^' if you want contains

    // use .lean() to get plain JS objects and .limit() to avoid huge responses
    const users = await User.find({ username: rx })
      .limit(50)
      .lean()
      .maxTimeMS(2000)
      .exec();

    return res.json({ count: users.length, users });
  } catch (err) {
    console.error('search-secure error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// secure aggregation: validate pipeline stages and operators
function validatePipeline(pipeline) {
  if (!Array.isArray(pipeline)) return false;
  // Allow only $match (with allowed fields) and $project (whitelist fields).
  for (const stage of pipeline) {
    if (typeof stage !== 'object' || stage === null) return false;
    const op = Object.keys(stage)[0];
    if (!['$match', '$project', '$limit', '$sort'].includes(op)) return false;
    if (op === '$match') {
      // ensure no operator keys like $where or $expr in user input
      const keys = JSON.stringify(stage.$match);
      if (keys.includes('$where') || keys.includes('$expr') || keys.includes('$function')) return false;
    }
    if (op === '$project') {
      // allow only whitelist fields to be projected
      const projKeys = Object.keys(stage.$project || {});
      const allowed = ['username', 'email'];
      if (projKeys.some(k => !allowed.includes(k))) return false;
    }
  }
  return true;
}

router.post('/aggregate-secure', async (req, res) => {
  try {
    const pipeline = req.body.pipeline;
    if (!validatePipeline(pipeline)) return res.status(400).json({ error: 'invalid pipeline' });

    const users = await User.aggregate(pipeline).limit(50).exec();
    return res.json({ count: users.length, results: users });
  } catch (err) {
    console.error('aggregate-secure error', err);
    return res.status(500).json({ error: 'server error' });
  }
});


module.exports = router;