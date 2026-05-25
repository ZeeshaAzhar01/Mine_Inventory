require("dotenv").config();
const app = require("./app"); // Import your configured Express app
const prisma = require("./config/prisma"); // Import your Prisma instance

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // 1. Connect to the Database FIRST
        await prisma.$connect();
        console.log("✅ Database connected successfully");

        // 2. Start the Express Server ONLY if the DB connects
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
        
    } catch (error) {
        console.error("❌ Failed to start the server:", error);
        
        // 3. Kill the process if the database fails
        process.exit(1); 
    }
}

startServer();