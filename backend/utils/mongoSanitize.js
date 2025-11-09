// Recursively remove keys that start with '$' or contain '.' from objects and arrays.
// Safe to run on req.body, req.query, req.params.

function sanitizeObjectInPlace(obj) {
  if (obj === null || obj === undefined) return obj;

  // If it's an array, sanitize each element
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const v = obj[i];
      if (v && typeof v === 'object') {
        sanitizeObjectInPlace(v);
      }
    }
    return obj;
  }

  if (typeof obj !== 'object') return obj;

  for (const key of Object.keys(obj)) {
    // Remove operator-like keys
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }
    const val = obj[key];
    if (val && typeof val === 'object') {
      sanitizeObjectInPlace(val);
    }
  }
  return obj;
}

module.exports = function mongoSanitizeInPlaceMiddleware() {
  return (req, res, next) => {
    try {
      if (req.body && typeof req.body === 'object') sanitizeObjectInPlace(req.body);
      if (req.params && typeof req.params === 'object') sanitizeObjectInPlace(req.params);
      if (req.query && typeof req.query === 'object') sanitizeObjectInPlace(req.query);
    } catch (err) {
      console.error('sanitize middleware error', err);
    }
    next();
  };
};
