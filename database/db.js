const mysql = require('mysql2/promise');


connection()

async function connection() {

    const dbconnection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1234',
        database: 'users'
    });

    module.exports.connection = dbconnection;
}