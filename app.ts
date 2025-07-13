import express from "express";
import { httpLogger, logger } from "./config/pino";
import { connectDB } from "./config/db";

import menuItemRoutes from "./routes/menu-item-routes";
import http from "http";
import { initSocket } from "./sockets/socketServer";
import orderRoutes from "./routes/order.routes";
import categoryRoutes from "./routes/category.routes";
import userRoutes from "./routes/user.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import kitchenRoutes from "./routes/kitchen.routes";

import { languageMiddleware } from "./middlewares/language.middleware";

import paymentRoutes from "./routes/payment.routes";
import shopRoutes from "./routes/shop.routes";
import { ErrorHandlerMiddleware } from "./middlewares/error-handling.middleware";
import planRoutes from "./routes/plan.routes";

const app = express();
const server = http.createServer(app);
initSocket(server);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);

app.use(languageMiddleware);

app.use("/api/v1/auth/user", userRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/orders", orderRoutes);
app.use("/", kitchenRoutes);
app.use("/menu-items", menuItemRoutes);
app.use("/category", categoryRoutes);

app.use(ErrorHandlerMiddleware);



app.use("/api/v1/plans", planRoutes);

app.use("/api/payments", paymentRoutes);
app.use("/api/v1/shops", shopRoutes);

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
});
