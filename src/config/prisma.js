require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Create a native PostgreSQL pool using your .env url
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Wrap the pool in the Prisma Driver Adapter
const adapter = new PrismaPg(pool);

// Pass the adapter into the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

module.exports = prisma;