const rateLimit = require('express-rate-limit');

// Rate limiter khusus untuk proses Autentikasi (Login, Register, Google Auth)
// Mencegah serangan brute force password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20, // Maksimal 20 percobaan per window per IP
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login/autentikasi dari IP ini. Silakan coba lagi setelah 15 menit.',
    });
  },
});

// Rate limiter umum untuk seluruh endpoint API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 500, // Maksimal 500 request per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak permintaan ke server. Silakan coba beberapa saat lagi.',
    });
  },
});

module.exports = { authLimiter, apiLimiter };
