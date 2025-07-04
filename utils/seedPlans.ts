import mongoose from 'mongoose';
import { Plans } from '../models/Plan';
import { connectDB } from '../config/db';

const plans = [
  {
    name: 'Starter',
    price: 0,
    duration: 7, 
    itemLimit: 15,
    categoryLimit: 5,
    features: [
      'Basic features',
      'No card required',
      'Trial support',
    ],
    isActive: true,
  },
  {
    name: 'Basic',
    price: 699,
    duration: 30, 
    itemLimit: 100,
    categoryLimit: 15,
    features: [
      'Up to 100 items',
      'Up to 15 categories',
      'Basic support',
    ],
    isActive: true,
  },
  {
    name: 'Premium',
    price: 999,
    duration: 30, // days
    itemLimit: -1, // unlimited
    categoryLimit: -1, // unlimited
    features: [
      'Unlimited items',
      'Unlimited categories',
      'Premium support',
    ],
    isActive: true,
  },
];

async function seedPlans() {
  await connectDB();
  for (const plan of plans) {
    await Plans.findOneAndUpdate(
      { name: plan.name },
      plan,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log('Plans seeded successfully.');
  mongoose.connection.close();
}

seedPlans().catch((err) => {
  console.error('Error seeding plans:', err);
  mongoose.connection.close();
}); 