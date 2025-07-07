import express from "express";
import { httpLogger, logger } from "./config/pino";
import { connectDB } from "./config/db";
import userRoutes from './routes/user.routes';
import subscriptionRoutes from './routes/subscription.routes';
// import planRoutes from './routes/plan.routes';
import paymobRoutes from './routes/paymob.routes';
import paymentRoutes from './routes/payment.routes';
import shopRoutes from './routes/shop.routes';
import { ErrorHandlerMiddleware } from "./middlewares/error-handling.middleware";
import { languageMiddleware } from "./middlewares/language.middleware";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);
app.use(languageMiddleware)

app.use('/api/v1/auth/user', userRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/paymob', paymobRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/v1/shops', shopRoutes);

app.use(ErrorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
})

