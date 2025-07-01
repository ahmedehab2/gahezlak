import mongoose from "mongoose";
import { logger } from "./pino";



export const connectDB = async () => {
    try {
        const dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/gahezlak";
        await mongoose.connect(dbURI)
        logger.info("MongoDB connected successfully");
    } catch (error) {
        logger.error("MongoDB connection error:", error);
        process.exit(1);
    }
}