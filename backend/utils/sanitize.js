// Simple string sanitizer: remove literal $ and . characters to avoid
// operator/key injection from user-supplied strings.
// this function is for sanitizing single string values; for
// object bodies use mongoSanitizeInPlace middleware.

module.exports = function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  // Replace any $ or . characters
  return input.replace(/[$.]/g, '');
};