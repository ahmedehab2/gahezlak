import express from "express";
import { httpLogger, logger } from "./config/pino";
import { connectDB } from "./config/db";
import menuItemRoutes from "./common/routes/menu-item-routes";
import { errorHandler } from "./middlewares/errorHandler";
import http from "http"
import { initSocket } from "./sockets/socketServer";
import orderRoutes from "./common/routes/order.routes";
import categoryRoutes from "./common/routes/category.routes";
import cron from "node-cron";
import { Request, Response, NextFunction } from "express";
import userRoutes from './routes/user.routes';
import subscriptionRoutes from './routes/subscription.routes';
import { Users } from "./models/User";
import { requireActiveSubscription } from "./middlewares/subscription";
import kitchenRoutes from "./common/routes/kitchen.routes";

import { languageMiddleware } from './middlewares/language.middleware';


const app = express();
const server = http.createServer(app);
initSocket(server);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);

app.use(languageMiddleware);

app.use('/api/v1/auth/user', userRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/orders', orderRoutes);
app.use("/",kitchenRoutes);
app.use('/menu-items',requireActiveSubscription ,menuItemRoutes);
app.use("/category",requireActiveSubscription,categoryRoutes)

app.use(errorHandler);

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

