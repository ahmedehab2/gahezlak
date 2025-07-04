import express, { Request, Response, NextFunction } from "express";
import { httpLogger, logger } from "./config/pino";
import { connectDB } from "./config/db";
import userRoutes from './routes/user.routes';
import cron from 'node-cron';
import { Users } from './models/User';
import subscriptionRoutes from './routes/subscription.routes';
import planRoutes from './routes/plan.routes';



const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);


app.use('/api/v1/auth/user', userRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/plans', planRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message });
  return;
});



// Background job: Clean up expired verification codes every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  const now = new Date();
  await Users.updateMany(
    {
      'verificationCode.expireAt': { $lt: now },
      isVerified: false,
      'verificationCode.code': { $ne: null }
    },
    {
      $set: {
        'verificationCode.code': null,
        'verificationCode.expireAt': null,
        'verificationCode.reason': null
      }
    }
  );
  console.log('Expired verification codes cleaned up.');
});



const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
})

