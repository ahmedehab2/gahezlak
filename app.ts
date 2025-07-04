import express, { Request, Response, NextFunction } from "express";
import { httpLogger, logger } from "./config/pino";
import { connectDB } from "./config/db";
import { errorHandler } from "./middlewares/errorHandler";
import http from "http"
import { initSocket } from "./sockets/socketServer";
import orderRoutes from "./common/routes/order.routes";
const app = express();
const server = http.createServer(app);
initSocket(server);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);

app.use("/orders", orderRoutes);


app.use(errorHandler);

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
})

