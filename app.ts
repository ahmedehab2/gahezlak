import express, { Request, Response, NextFunction } from "express";
import { httpLogger, logger } from "./config/pino";
import { connectDB } from "./config/db";
import userRoutes from './routes/user.routes';
import subscriptionRoutes from './routes/subscription.routes';
import planRoutes from './routes/plan.routes';
import paymobRoutes from './routes/paymob.routes';
import paymentRoutes from './routes/payment.routes';



const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);


app.use('/api/v1/auth/user', userRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/paymob', paymobRoutes);
app.use('/api/payments', paymentRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message });
  return;
});







const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
})

