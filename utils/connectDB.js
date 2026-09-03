const mongoose = require('mongoose');

// Cached connection untuk serverless environment (Vercel)
// Tanpa caching, setiap cold start akan membuat koneksi baru
// yang menyebabkan buffering timeout
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Jika sudah ada koneksi aktif (readyState 1 = connected), langsung pakai
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Jika sedang proses koneksi, tunggu promise yang sudah ada
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,       // Jangan buffer, langsung error jika belum connect
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts)
      .then((mongooseInstance) => {
        console.log('✅ MongoDB connected (cached)');
        return mongooseInstance;
      })
      .catch((err) => {
        // Reset promise agar retry bisa dilakukan di request berikutnya
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
