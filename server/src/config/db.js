import mongoose from "mongoose";
import { wakeAiService,keepAiAlive } from "../utils/aiServiceManager.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options prevent deprecation warnings
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if can't reach Atlas
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    await wakeAiService();

    // Log when connection drops — useful for debugging Atlas free tier idle timeouts
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting reconnect...");
    });
    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected.");
    });
    keepAiAlive();
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    // Exit process so nodemon/PM2 can restart and retry
    process.exit(1);
  }
};

export default connectDB;
