const db = require('../config/db');

// Lấy danh sách sản phẩm theo tenant
exports.getProducts = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const query = `
      SELECT p.id, p.name, p.description, p.has_variants, p.active, p.created_at,
             c.name as category_name, b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.tenant_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(query, [tenantId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách sản phẩm:', err.message);
    res.status(500).json({ error: 'Lỗi cơ sở dữ liệu' });
  }
};

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
  const { name, description, category_id, brand_id, has_variants } = req.body;
  const tenantId = req.user.tenant_id;

  if (!name) {
    return res.status(400).json({ error: 'Tên sản phẩm không được để trống' });
  }

  try {
    const query = `
      INSERT INTO products (tenant_id, name, description, category_id, brand_id, has_variants)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [tenantId, name, description || null, category_id || null, brand_id || null, has_variants || false];
    const result = await db.query(query, values);

    res.status(201).json({
      message: 'Tạo sản phẩm thành công',
      product: result.rows[0]
    });
  } catch (err) {
    console.error('Lỗi tạo sản phẩm:', err.message);
    res.status(500).json({ error: 'Lỗi cơ sở dữ liệu' });
  }
};