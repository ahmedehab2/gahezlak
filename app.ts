import express from "express";
import { httpLogger, logger } from "./config/pino";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import adminRoutes from "./routes/admin.routes";

// import http from "http";
// import { initSocket } from "./sockets/socketServer";
import { ErrorHandlerMiddleware } from "./middlewares/error-handling.middleware";
import { languageMiddleware } from "./middlewares/language.middleware";
import planRoutes from "./routes/plan.routes";
// import paymentRoutes from "./routes/payment.routes";
import shopRoutes from "./routes/shop.routes";
import roleRoutes from "./routes/role.routes";
import { aiMenuRoutes } from "./routes/ai-menu.routes";

import cors from "cors";
import { errMsg } from "./common/err-messages";
import { Errors } from "./errors";
import webhooksRoutes from "./routes/webhooks.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);
app.use(languageMiddleware);

// const server = http.createServer(app);
// initSocket(server);

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use("/api/v1/webhooks", webhooksRoutes);

app.use("/api/v1/plans", planRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
// app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/shops", shopRoutes);
app.use("/api/v1/roles", roleRoutes);
app.use("/api/v1/ai/menu", aiMenuRoutes);
app.use("/api/v1/admin", adminRoutes);

app.use((req, res, next) => {
  throw new Errors.NotFoundError(errMsg.ROUTE_NOT_FOUND);
});

app.use(ErrorHandlerMiddleware);

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
});
