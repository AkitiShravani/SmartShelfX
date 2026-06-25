require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || 'root',
            database: process.env.DB_NAME || 'smartshelf',
        });
        
        console.log('✓ MySQL connection successful!');
        const [rows] = await connection.execute('SELECT VERSION()');
        console.log('MySQL Version:', rows[0]['VERSION()']);
        await connection.end();
    } catch (error) {
        console.error('✗ MySQL connection failed:');
        console.error('  Code:', error.code);
        console.error('  Message:', error.message);
        console.error('  Config:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
        });
        process.exit(1);
    }
}

testConnection();
