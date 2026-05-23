require('dotenv').config();
const prisma = require('./config/prisma');


async function testDB() {
    try {
        await prisma.$connect();
        console.log("Database connected successfully");
    } catch (error) {
        console.log(error);
    }
}

testDB();