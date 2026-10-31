import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { logger } from "./config/logger.js";
import http from "http";

async function bootstrap(): Promise<void> {
  try {
    // 1. Establish database connection
    await connectDb();

    // 2. Start HTTP server
    const server = http.createServer(app);

    server.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, environment: env.NODE_ENV },
        `LoopBill Backend API running on port ${env.PORT}`,
      );
    });

    // 3. Graceful shutdown handler
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(
        { signal },
        `Received ${signal}. Initiating graceful shutdown...`,
      );

      server.close(async () => {
        logger.info("HTTP server closed.");
        await disconnectDb();
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error("Forcefully terminating process due to shutdown timeout.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      logger.fatal({ err: reason }, "Unhandled Promise Rejection detected.");
    });

    process.on("uncaughtException", (err) => {
      logger.fatal({ err }, "Uncaught Exception detected. Exiting.");
      process.exit(1);
    });
  } catch (err) {
    logger.fatal({ err }, "Fatal bootstrap failure.");
    process.exit(1);
  }
}

bootstrap();
