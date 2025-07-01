import express, { Request, Response, NextFunction } from "express";
import { httpLogger, logger } from "./config/pino";
import { connectDB } from "./config/db";



const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);




app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);
  res.status(500).json({ message: err.message });
  return;

});

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
})

