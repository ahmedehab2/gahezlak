import express from "express";
import { httpLogger, logger } from "./config/pino";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import subscriptionRoutes from "./routes/subscription.routes";
// import kitchenRoutes from "./routes/shop.routes";
// import http from "http";
// import { initSocket } from "./sockets/socketServer";
import { ErrorHandlerMiddleware } from "./middlewares/error-handling.middleware";
import { languageMiddleware } from "./middlewares/language.middleware";
import planRoutes from "./routes/plan.routes";
import paymentRoutes from "./routes/payment.routes";
import shopRoutes from "./routes/shop.routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);
app.use(languageMiddleware);

// const server = http.createServer(app);
// initSocket(server);

app.use("/api/v1/plans", planRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/shops", shopRoutes);

app.use(ErrorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
});
