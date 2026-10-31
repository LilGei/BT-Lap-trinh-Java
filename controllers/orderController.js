const db = require('../config/db');

// Lấy danh sách đơn hàng của tenant
exports.getOrders = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const query = `
      SELECT o.id, o.code, o.channel, o.status, o.customer_name, o.customer_phone, 
             o.total, o.payment_method, o.created_at
      FROM orders o
      WHERE o.tenant_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(query, [tenantId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách đơn hàng:', err.message);
    res.status(500).json({ error: 'Lỗi cơ sở dữ liệu' });
  }
};

// Tạo đơn hàng mới & phát thông báo Real-time (FR-ORD-01 & FR-SIM-02)
exports.createOrder = async (req, res) => {
  const { code, channel, customer_name, customer_phone, payment_method, subtotal, discount, total } = req.body;
  const tenantId = req.user.tenant_id;
  const userId = req.user.id;

  if (!code) {
    return res.status(400).json({ error: 'Mã đơn hàng (code) không được để trống' });
  }

  try {
    const userResult = await db.query('SELECT branch_id FROM users WHERE id = $1', [userId]);
    const branchId = userResult.rows[0]?.branch_id;

    if (!branchId) {
      return res.status(400).json({ error: 'Người dùng chưa được gán chi nhánh (branch_id)' });
    }

    const query = `
      INSERT INTO orders (tenant_id, branch_id, code, channel, customer_name, customer_phone, payment_method, subtotal, discount, total, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      tenantId, branchId, code, channel || 'POS', customer_name || 'Khách lẻ',
      customer_phone || null, payment_method || 'CASH', subtotal || 0, discount || 0, total || 0, userId
    ];

    const result = await db.query(query, values);
    const newOrder = result.rows[0];

    // Phát sự kiện Real-time qua Socket.io
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_order', { message: 'Có đơn hàng mới!', order: newOrder });
    }

    res.status(201).json({
      message: 'Tạo đơn hàng thành công',
      order: newOrder
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Mã đơn hàng (code) đã tồn tại' });
    }
    console.error('Lỗi tạo đơn hàng:', err.message);
    res.status(500).json({ error: 'Lỗi cơ sở dữ liệu' });
  }
};

// Cập nhật trạng thái đơn hàng - State Machine (FR-ORD-02/03)
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const tenantId = req.user.tenant_id;

  const validStatuses = ['DRAFT', 'RESERVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  }

  try {
    const query = `
      UPDATE orders 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 AND tenant_id = $3 
      RETURNING *
    `;
    const result = await db.query(query, [status, id, tenantId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    res.json({ message: 'Cập nhật trạng thái thành công', order: result.rows[0] });
  } catch (err) {
    console.error('Lỗi cập nhật trạng thái:', err.message);
    res.status(500).json({ error: 'Lỗi cơ sở dữ liệu' });
  }
};

// Giả lập nhận Webhook đơn hàng từ kênh ngoài (FR-SIM-01)
exports.simulateWebhook = async (req, res) => {
  const { external_order_id, channel, customer_name, total } = req.body;
  const tenantId = req.user.tenant_id;
  const userId = req.user.id;

  try {
    const userResult = await db.query('SELECT branch_id FROM users WHERE id = $1', [userId]);
    const branchId = userResult.rows[0]?.branch_id;

    // Sinh đuôi ngẫu nhiên dựa theo thời gian để mã không bị trùng khi test nhiều lần
    const randomSuffix = Date.now().toString().slice(-6);
    const code = `WH-${randomSuffix}`;
    const extId = external_order_id || `EXT-${randomSuffix}`;

    const query = `
      INSERT INTO orders (tenant_id, branch_id, code, external_order_id, channel, customer_name, total, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'CONFIRMED', $8)
      RETURNING *
    `;
    const values = [tenantId, branchId, code, extId, channel || 'SHOPEE', customer_name || 'Khách Webhook', total || 100000, userId];
    const result = await db.query(query, values);

    // Phát sự kiện Real-time
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_order', { message: 'Đơn hàng mới từ Webhook!', order: result.rows[0] });
    }

    res.status(201).json({ message: 'Giả lập Webhook nhận đơn thành công', order: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Mã đơn hàng ngoại (external_order_id) đã tồn tại' });
    }
    console.error('Lỗi xử lý Webhook:', err.message);
    res.status(500).json({ error: 'Lỗi xử lý Webhook: ' + err.message });
  }
};