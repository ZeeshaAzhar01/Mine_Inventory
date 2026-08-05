require("dotenv").config();
const app = require("./app"); // Import your configured Express app
const prisma = require("./config/prisma"); // Import your Prisma instance
const { logger } = require("./config/logger"); // Import Winston logger

const PORT = process.env.PORT || 3000;
let server;

async function startServer() {
    try {
        // 1. Connect to the Database FIRST
        await prisma.$connect();
        logger.info("Database connected successfully");

        // 2. Start the Express Server ONLY if the DB connects
        server = app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Server is running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        
    } catch (error) {
        logger.error("Failed to start the server:", error);
        
        // 3. Kill the process if the database fails
        process.exit(1); 
    }
}

// Graceful Shutdown Process Management
const handleShutdown = async (signal) => {
    logger.info(`Received ${signal}. Gracefully shutting down server...`);
    if (server) {
        server.close(async () => {
            logger.info("HTTP server closed.");
            try {
                await prisma.$disconnect();
                logger.info("Database connection closed.");
                process.exit(0);
            } catch (err) {
                logger.error("Error disconnecting database during shutdown:", err);
                process.exit(1);
            }
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();