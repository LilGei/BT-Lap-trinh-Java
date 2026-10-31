const db = require('../config/db');

// API Báo cáo tổng quan doanh thu & tổng đơn (FR-REP-01)
exports.getRevenueReport = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const query = `
      SELECT 
        COUNT(id) AS total_orders,
        COALESCE(SUM(total), 0) AS total_revenue,
        COALESCE(AVG(total), 0) AS average_order_value
      FROM orders
      WHERE tenant_id = $1 AND status = 'COMPLETED'
    `;
    const result = await db.query(query, [tenantId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Lỗi báo cáo:', err.message);
    res.status(500).json({ error: 'Lỗi cơ sở dữ liệu' });
  }
};