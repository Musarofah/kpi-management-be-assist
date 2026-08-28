const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedHRUsers = async () => {
  try {
    const hrUsers = [
      {
        name: 'HR Admin',
        email: 'hr.admin@assist.id',
        password: 'AdminHR123!',
        role: 'hr',
        position: 'HR Administrator',
      },
      {
        name: 'HR People Partner',
        email: 'hr.people@assist.id',
        password: 'HRpeople123!',
        role: 'hr',
        position: 'HR People & Culture Partner',
      },
    ];

    for (const hr of hrUsers) {
      const existing = await User.findOne({ email: hr.email }).select('+password');
      if (!existing) {
        const hashedPassword = await bcrypt.hash(hr.password, 10);
        await User.create({
          name: hr.name,
          email: hr.email,
          password: hashedPassword,
          role: hr.role,
          position: hr.position,
        });
        console.log(`🌱 Seeded HR User: ${hr.email}`);
      } else {
        // Ensure role is hr
        let needsSave = false;
        if (existing.role !== 'hr') {
          existing.role = 'hr';
          needsSave = true;
        }
        // Verify or update password if needed
        const isMatch = await bcrypt.compare(hr.password, existing.password);
        if (!isMatch) {
          existing.password = await bcrypt.hash(hr.password, 10);
          needsSave = true;
        }
        if (needsSave) {
          await existing.save();
          console.log(`🔄 Updated HR User credentials: ${hr.email}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error seeding HR users:', err.message);
  }
};

module.exports = { seedHRUsers };
