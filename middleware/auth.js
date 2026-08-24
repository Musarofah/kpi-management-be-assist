const jwt = require('jsonwebtoken');

// Cek user udah login (token valid)
exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Tidak ada token, akses ditolak' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token tidak valid atau kadaluarsa' });
  }
};

// Cek role harus HR
exports.hrOnly = (req, res, next) => {
  if (req.user.role !== 'hr') {
    return res.status(403).json({ message: 'Akses ditolak, khusus HR' });
  }
  next();
};