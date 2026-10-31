const db = require('../config/db');
const jwt = require('jsonwebtoken');

// Đăng nhập
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const user = result.rows[0];

    // Kiểm tra mật khẩu mẫu
    const isMatch = password === user.password_hash;
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const secret = process.env.JWT_SECRET || 'oism_secret_key_2026';
    const token = jwt.sign(
      { id: user.id, tenant_id: user.tenant_id, role: user.role },
      secret,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Lấy thông tin tài khoản hiện tại
exports.getMe = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, role, active, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cơ sở dữ liệu' });
  }
};