const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Lưu instance Socket.io để truy cập từ các controller
app.set('socketio', io);

// Middlewares toàn cục
app.use(cors());
app.use(express.json());

// Import các Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Đăng ký các Route API chính
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);

// API kiểm tra trạng thái Server
app.get('/', (req, res) => {
  res.send('OISM Backend Node.js đang chạy thành công!');
});

// API kiểm tra kết nối PostgreSQL
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      message: 'Kết nối PostgreSQL thành công!',
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error('Lỗi kết nối DB:', err.message);
    res.status(500).json({ error: 'Lỗi kết nối cơ sở dữ liệu' });
  }
});

// API kiểm tra danh sách tài khoản
app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, full_name, role, active, created_at FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Lỗi lấy danh sách users:', err.message);
    res.status(500).json({ error: 'Lỗi cơ sở dữ liệu' });
  }
});

// Lắng nghe sự kiện kết nối Real-time (Socket.io)
io.on('connection', (socket) => {
  console.log('Client kết nối Real-time:', socket.id);
});

// Khởi chạy Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`Server Node.js đang chạy tại: http://localhost:${PORT}`);
  console.log(`=================================`);
});