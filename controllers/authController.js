const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Helper function to decode / verify Google Token
const verifyGoogleToken = async (token) => {
  // 1. Try google oauth2 tokeninfo (for id_token)
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (res.ok) {
      const data = await res.json();
      if (data.email) {
        return {
          email: data.email,
          name: data.name || data.email.split('@')[0],
          avatar: data.picture || '',
          googleId: data.sub || '',
        };
      }
    }
  } catch (e) {
    // Continue to next fallback
  }

  // 2. Try userinfo endpoint (for access_token)
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.email) {
        return {
          email: data.email,
          name: data.name || data.email.split('@')[0],
          avatar: data.picture || '',
          googleId: data.sub || '',
        };
      }
    }
  } catch (e) {
    // Continue to next fallback
  }

  // 3. Fallback: Parse JWT payload without verification for mock / development tokens
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      if (payload && payload.email) {
        return {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          avatar: payload.picture || '',
          googleId: payload.sub || '',
        };
      }
    }
  } catch (e) {
    // Fallback failed
  }

  return null;
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, position } = req.body;

    // Validasi input dasar
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi',
      });
    }

    // Cek email udah dipakai belum
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'karyawan',
      department,
      position,
    });

    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      position: user.position,
      avatar: user.avatar,
    };

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: userData,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi',
      });
    }

    // Perlu select('+password') karena password di model pakai select: false
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      position: user.position,
      avatar: user.avatar,
    };

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      data: userData,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GOOGLE OAUTH LOGIN (Karyawan)
exports.googleLogin = async (req, res) => {
  try {
    const { token, credential } = req.body;
    const googleToken = token || credential;

    if (!googleToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token wajib dikirim',
      });
    }

    const profile = await verifyGoogleToken(googleToken);
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Token Google tidak valid atau gagal diverifikasi',
      });
    }

    let user = await User.findOne({ email: profile.email });

    if (!user) {
      // Buat akun karyawan baru dari akun Google
      user = await User.create({
        name: profile.name,
        email: profile.email,
        role: 'karyawan',
        avatar: profile.avatar,
        googleId: profile.googleId,
        position: 'Karyawan',
      });
    } else {
      // Update avatar / googleId jika ada update
      let needsSave = false;
      if (profile.avatar && !user.avatar) {
        user.avatar = profile.avatar;
        needsSave = true;
      }
      if (profile.googleId && !user.googleId) {
        user.googleId = profile.googleId;
        needsSave = true;
      }
      if (needsSave) await user.save();
    }

    const appToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      position: user.position,
      avatar: user.avatar,
    };

    res.json({
      success: true,
      message: 'Login Google berhasil',
      token: appToken,
      data: userData,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ME — cek user yang sedang login
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('department', 'name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const userData = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      position: user.position,
      avatar: user.avatar,
    };

    res.json({
      success: true,
      data: userData,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};