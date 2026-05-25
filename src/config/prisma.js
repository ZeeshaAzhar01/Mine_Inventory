// Import the standard Prisma Client
const { PrismaClient } = require('@prisma/client');

// Initialize a new instance of the Prisma Client
const prisma = new PrismaClient();

// Export it so we can use it anywhere in our app (like in controllers or server.js)
module.exports = prisma;