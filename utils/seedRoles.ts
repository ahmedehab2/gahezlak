import mongoose from 'mongoose';
import { Roles } from '../models/Role';
import { connectDB } from '../config/db';

const rolesToSeed = [
  'customer',
  'manager',
  'staff',
  'owner',
];

async function seedRoles() {
  await connectDB();
  for (const role of rolesToSeed) {
    const exists = await Roles.findOne({ role });
    if (!exists) {
      await Roles.create({ role });
      console.log(`Seeded role: ${role}`);
    } else {
      console.log(`Role already exists: ${role}`);
    }
  }
  mongoose.connection.close();
}

seedRoles().catch((err) => {
  console.error('Error seeding roles:', err);
  mongoose.connection.close();
}); 