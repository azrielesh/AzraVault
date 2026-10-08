// Add this route inside your server.js for bulk Excel/CSV defaulter imports
app.post('/api/borrowers/bulk', async (req, res) => {
  const { tenant_id, borrowers } = req.body;
  if (!Array.isArray(borrowers)) return res.status(400).json({ error: 'Invalid data format' });

  try {
    for (const b of borrowers) {
      const principal = parseFloat(b.principal) || 0;
      const amountDue = principal + (principal * 0.15);
      await pool.query(
        `INSERT INTO borrowers (tenant_id, borrower_name, phone_number, nin, principal, amount_due, due_date, collateral, guarantor, guarantor_phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenant_id, b.borrower_name, b.phone_number, b.nin || 'N/A', principal, amountDue, b.due_date || '2026-12-31', b.collateral || 'General Asset', b.guarantor || 'N/A', b.phone_number]
      );
    }
    res.json({ success: true, message: `${borrowers.length} defaulters imported and contracts auto-generated!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});