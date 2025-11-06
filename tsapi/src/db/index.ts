import mysql from 'mysql2/promise';

// Database configuration
const DB_CONFIG = {
    // host: process.env.DB_HOST || 'host.docker.internal',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'hive_data',
};

// Create a connection pool
export const pool = mysql.createPool(DB_CONFIG);

console.log('Database pool created successfully.');
