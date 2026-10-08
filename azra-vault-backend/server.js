const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// MySQL Database Connection Pool using Aiven URL
const pool = mysql.createPool(process.env.DATABASE_URL || "mysql://avnadmin:AVNS_VwRcryUdQSSoSkL04zr@my-ai-assistant-db-azrielesh1-3a6a.f.aivencloud.com:15738/defaultdb?ssl-mode=REQUIRED");

// Test Connection Route
app.get('/api', (req, res) => {
  res.json({ status: 'Azra Vault API is live and running securely' });
});

// 1. Get Borrowers / Defaulters Ledger per Tenant
app.get('/api/borrowers', async (req, res) => {
  const { tenant_id } = req.query;
  try {
    let query = 'SELECT * FROM borrowers';
    let params = [];
    if (tenant_id) {
      query += ' WHERE tenant_id = ?';
      params.push(tenant_id);
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Originate Single Loan Account
app.post('/api/borrowers', async (req, res) => {
  const { tenant_id, borrower_name, phone_number, nin, principal, interest_rate, due_date, frequency, guarantor, guarantor_phone, collateral, client_image } = req.body;
  
  try {
    const p = parseFloat(principal) || 0;
    const rate = parseFloat(interest_rate) || 15;
    const amount_due = p + (p * (rate / 100));

    const [result] = await pool.query(
      `INSERT INTO borrowers (tenant_id, borrower_name, phone_number, nin, principal, interest_rate, amount_due, due_date, frequency, guarantor, guarantor_phone, collateral, client_image, contract_signed) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [tenant_id, borrower_name, phone_number, nin, p, rate, amount_due, due_date, frequency || 'Monthly', guarantor, guarantor_phone, collateral, client_image]
    );

    res.json({ success: true, borrowerId: result.insertId, message: 'Loan and legal contract successfully saved!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Bulk Excel / CSV Defaulter Import Route
app.post('/api/borrowers/bulk', async (req, res) => {
  const { tenant_id, borrowers } = req.body;
  if (!Array.isArray(borrowers)) return res.status(400).json({ error: 'Invalid data format' });

  try {
    for (const b of borrowers) {
      const principal = parseFloat(b.principal) || 100000;
      const amountDue = principal + (principal * 0.15);
      await pool.query(
        `INSERT INTO borrowers (tenant_id, borrower_name, phone_number, nin, principal, amount_due, due_date, collateral, guarantor, guarantor_phone, contract_signed) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
        [tenant_id, b.borrower_name, b.phone_number, b.nin || 'N/A', principal, amountDue, b.due_date || '2026-12-31', b.collateral || 'General Asset', b.guarantor || 'N/A', b.phone_number]
      );
    }
    res.json({ success: true, message: `${borrowers.length} defaulters imported and contracts auto-generated!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Log Repayments
app.post('/api/repayments', async (req, res) => {
  const { borrower_id, amount } = req.body;
  try {
    const [rows] = await pool.query('SELECT amount_paid FROM borrowers WHERE id = ?', [borrower_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Borrower not found' });

    const currentPaid = parseFloat(rows[0].amount_paid) || 0;
    const newPaid = currentPaid + parseFloat(amount);
    const txRef = 'TX-' + Math.floor(100000 + Math.random() * 900000);

    await pool.query('UPDATE borrowers SET amount_paid = ? WHERE id = ?', [newPaid, borrower_id]);
    res.json({ success: true, txRef, message: 'Payment recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Lender Registration Route
app.post('/api/lenders/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const lenderCode = 'LND-' + Math.floor(100000 + Math.random() * 900000);
    // In production, save to lenders table. For now, returning success and code.
    res.json({ success: true, lenderCode, message: 'Lender registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  // Default master admin or standard lender login check
  if (email === 'admin@azravault.com' && password === 'admin123') {
    return res.json({ success: true, user: { name: 'Master Admin', email, role: 'admin', tenant_id: 'MASTER' } });
  }
  
  // Standard tenant mock login fallback for prototype
  res.json({ 
    success: true, 
    user: { name: email.split('@')[0], email, role: 'lender', tenant_id: email, approval_code: 'LND-998877' } 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Azra Vault Server live on port ${PORT}`));