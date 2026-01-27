const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'CEiAdmin0',
    database: 'ceidb'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting:', err);
        process.exit(1);
    }

    // Check if users table exists
    db.query('SHOW TABLES LIKE "users"', (err, results) => {
        if (err) {
            console.error('Error checking table:', err);
            db.end();
            process.exit(1);
        }

        if (results.length === 0) {
            console.log('❌ Users table does NOT exist!');
            console.log('Run this SQL to create it:');
            console.log(`
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    profile_image VARCHAR(500),
    google_id VARCHAR(255) UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_google_id (google_id)
);
            `);
        } else {
            console.log('✅ Users table exists!');
            db.query('DESCRIBE users', (err, columns) => {
                if (err) {
                    console.error('Error describing table:', err);
                } else {
                    console.log('Columns:', columns.map(c => c.Field).join(', '));
                }
                db.end();
            });
        }
    });
});
