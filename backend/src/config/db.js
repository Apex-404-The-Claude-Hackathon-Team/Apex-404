const mongoose = require('mongoose');
const User = require('../models/User');
const MPProfile = require('../models/MPProfile');

const seedDatabase = async () => {
  console.log('Checking demo accounts seeding status...');
  
  // Create citizen user
  let citizen = await User.findOne({ email: 'citizen@voiceup.gh' });
  if (!citizen) {
    citizen = await User.create({
      firstName: 'Citizen',
      lastName: 'User',
      email: 'citizen@voiceup.gh',
      password: 'demoPassword123',
      role: 'member',
      constituency: 'mp_1',
      isEmailVerified: true,
      isVerifiedVoter: true,
      voterVerificationStatus: 'verified'
    });
    console.log('Seeded citizen user:', citizen.email);
  }

  // Create MP user
  let mpUser = await User.findOne({ email: 'mp@voiceup.gh' });
  if (!mpUser) {
    mpUser = await User.create({
      firstName: 'Osei',
      lastName: 'Kyei-Mensah',
      email: 'mp@voiceup.gh',
      password: 'demoPassword123',
      role: 'mp',
      constituency: 'mp_1',
      isEmailVerified: true
    });
    console.log('Seeded MP user:', mpUser.email);
  }

  // Create MP Profile
  const mpProfileExists = await MPProfile.findOne({ constituency: 'mp_1' });
  if (!mpProfileExists && mpUser) {
    const mpProfile = await MPProfile.create({
      user: mpUser._id,
      constituency: 'mp_1',
      party: 'NPP',
      bio: 'Elected Member of Parliament for Suame. Dedicated to local industrial growth, road safety, and community transparency.',
      isVerified: true,
      contactEmail: 'mp.suame@parliament.gh',
      contactPhone: '+233 30 223 4567',
      profilePhoto: {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
        publicId: 'mp_suame_photo'
      }
    });
    console.log('Seeded MP profile:', mpProfile.constituency);
  }
};

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  await seedDatabase().catch(err => console.error('Database seeding failed:', err));
};

module.exports = connectDB;
