const mysql = require('mysql2/promise');
const DATABASE_URL = "mysql://avnadmin:AVNS_VwRcryUdQSSoSkL04zr@my-ai-assistant-db-azrielesh1-3a6a.f.aivencloud.com:15738/defaultdb?ssl-mode=REQUIRED";

async function upgradeDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  await connection.query(`
    CREATE TABLE IF NOT EXISTS borrowers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(255) NOT NULL,
      borrower_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(50) NOT NULL,
      nin VARCHAR(50) NOT NULL,
      principal DECIMAL(15,2) NOT NULL,
      interest_rate DECIMAL(5,2) DEFAULT 15.00,
      amount_due DECIMAL(15,2) NOT NULL,
      amount_paid DECIMAL(15,2) DEFAULT 0.00,
      due_date DATE NOT NULL,
      frequency VARCHAR(50) DEFAULT 'Monthly',
      status VARCHAR(50) DEFAULT 'Active',
      collateral TEXT,
      guarantor VARCHAR(255),
      guarantor_phone VARCHAR(50),
      guarantor_nin VARCHAR(50),
      nok_name VARCHAR(255),
      nok_relation VARCHAR(100),
      nok_phone VARCHAR(50),
      nok_nin VARCHAR(50),
      client_image LONGTEXT,
      collateral_image LONGTEXT,
      contract_signed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log("Database tables successfully updated with image and profile fields!");
  await connection.end();
}
upgradeDatabase();