const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

async function initDb(config) {
  if (pool) return pool;
  const host = (config && config.host) || process.env.MYSQL_HOST || '127.0.0.1';
  const user = (config && config.user) || process.env.MYSQL_USER || 'root';
  const password = (config && config.password) || process.env.MYSQL_PASSWORD || '';
  const database = (config && config.database) || process.env.MYSQL_DATABASE || 'delivery_app';
  const port = (config && config.port) || (process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306);

  // Create database if it doesn't exist
  const tempConn = await mysql.createConnection({ host, user, password, port });
  await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await tempConn.end();

  pool = mysql.createPool({ host, user, password, database, port, waitForConnections: true, connectionLimit: 10 });
  await createTables();
  await migrateImageColumn();
  await seedData();
  await migrateProducts();
  return pool;
}

async function createTables() {
  const p = getPool();
  await p.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('customer','seller','delivery') NOT NULL,
    name VARCHAR(255) NOT NULL
  )`);
  await p.query(`CREATE TABLE IF NOT EXISTS delivery_personnel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('active','offline') NOT NULL DEFAULT 'offline',
    current_orders INT NOT NULL DEFAULT 0
  )`);
  await p.query(`CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    seller_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    image MEDIUMTEXT,
    category VARCHAR(255),
    stock INT NOT NULL DEFAULT 0,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await p.query(`CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_person_id INT,
    delivery_person_name VARCHAR(255),
    status ENUM('pending','assigned','in-transit','delivered','cancelled') NOT NULL DEFAULT 'pending',
    address TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (delivery_person_id) REFERENCES delivery_personnel(id) ON DELETE SET NULL
  )`);
  await p.query(`CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  )`);
}

async function seedData() {
  const p = getPool();
  const [userRows] = await p.query('SELECT COUNT(*) as cnt FROM users');
  if (userRows[0].cnt > 0) return; // already seeded

  await p.query(`INSERT INTO users (email, password, role, name) VALUES
    ('customer@example.com', 'password', 'customer', 'John Customer'),
    ('seller@example.com', 'password', 'seller', 'Jane Seller'),
    ('delivery@example.com', 'password', 'delivery', 'Bob Delivery')`);

  await p.query(`INSERT INTO delivery_personnel (name, email, status, current_orders) VALUES
    ('Bob Delivery', 'delivery@example.com', 'active', 2),
    ('Alice Driver', 'alice.driver@example.com', 'active', 1),
    ('Charlie Runner', 'charlie.runner@example.com', 'offline', 0)`);

  await p.query(`INSERT INTO products (id, seller_id, name, description, price, image, category, stock) VALUES
    ('1', 2, 'Laptop', 'High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD — perfect for work and gaming.', 74999, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=250&fit=crop&auto=format', 'Electronics', 10),
    ('2', 2, 'Wireless Mouse', 'Ergonomic wireless mouse with 2.4GHz connectivity, silent clicks and 18-month battery life.', 1299, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=250&fit=crop&auto=format', 'Electronics', 25),
    ('3', 2, 'Mechanical Keyboard', 'RGB mechanical keyboard with Cherry MX Blue switches, full anti-ghosting and aluminium frame.', 3499, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=250&fit=crop&auto=format', 'Electronics', 15),
    ('4', 2, 'Wireless Headphones', 'Over-ear noise-cancelling headphones with 30hr battery, Hi-Res audio and foldable design.', 4999, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=250&fit=crop&auto=format', 'Audio', 20),
    ('5', 2, 'Smartphone', 'Latest Android smartphone with 6.7&quot; AMOLED display, 50MP camera and 5000mAh battery.', 22999, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=250&fit=crop&auto=format', 'Mobile', 18),
    ('6', 2, '27" Monitor', '4K UHD IPS display, 144Hz refresh rate, HDR400 support and ultra-thin bezels for immersive viewing.', 18499, 'https://images.unsplash.com/photo-1527443224154-c4a573d5e212?w=400&h=250&fit=crop&auto=format', 'Electronics', 8)`);

  await p.query(`INSERT INTO orders (id, customer_id, customer_name, customer_email, total_amount, status, address, created_at) VALUES
    ('1', 1, 'John Customer', 'customer@example.com', 74999, 'delivered', '123 Main St, City, State 12345', '2024-01-15 00:00:00'),
    ('2', 1, 'John Customer', 'customer@example.com', 2598, 'pending', '123 Main St, City, State 12345', '2024-01-20 00:00:00')`);

  await p.query(`INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES
    ('1', '1', 'Laptop', 1, 74999),
    ('2', '2', 'Wireless Mouse', 2, 1299)`);

  console.log('Database seeded with mock data.');
}

async function migrateImageColumn() {
  const p = getPool();
  try {
    // Expand image column to MEDIUMTEXT to support base64 data URLs
    await p.query('ALTER TABLE products MODIFY COLUMN image MEDIUMTEXT');
  } catch (err) {
    // Ignore if already MEDIUMTEXT or migration already applied
  }
}

async function migrateProducts() {
  const p = getPool();
  // Update products that still have old placeholder images
  const updates = [
    { id: '1', name: 'Laptop', description: 'High-performance laptop with Intel Core i7, 16GB RAM, 512GB SSD — perfect for work and gaming.', price: 74999, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=250&fit=crop&auto=format', category: 'Electronics' },
    { id: '2', name: 'Wireless Mouse', description: 'Ergonomic wireless mouse with 2.4GHz connectivity, silent clicks and 18-month battery life.', price: 1299, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=250&fit=crop&auto=format', category: 'Electronics' },
    { id: '3', name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard with Cherry MX Blue switches, full anti-ghosting and aluminium frame.', price: 3499, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=250&fit=crop&auto=format', category: 'Electronics' },
  ];
  for (const u of updates) {
    await p.query(
      'UPDATE products SET name=?, description=?, price=?, image=?, category=? WHERE id=? AND image LIKE \'%placehold.co%\'',
      [u.name, u.description, u.price, u.image, u.category, u.id]
    );
  }
  // Insert new products if they don't exist
  const newProducts = [
    { id: '4', name: 'Wireless Headphones', description: 'Over-ear noise-cancelling headphones with 30hr battery, Hi-Res audio and foldable design.', price: 4999, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=250&fit=crop&auto=format', category: 'Audio', stock: 20 },
    { id: '5', name: 'Smartphone', description: 'Latest Android smartphone with 6.7" AMOLED display, 50MP camera and 5000mAh battery.', price: 22999, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=250&fit=crop&auto=format', category: 'Mobile', stock: 18 },
    { id: '6', name: '27" Monitor', description: '4K UHD IPS display, 144Hz refresh rate, HDR400 support and ultra-thin bezels for immersive viewing.', price: 18499, image: 'https://images.unsplash.com/photo-1527443224154-c4a573d5e212?w=400&h=250&fit=crop&auto=format', category: 'Electronics', stock: 8 },
  ];
  const [sellerRows] = await p.query('SELECT id FROM users WHERE role = \'seller\' LIMIT 1');
  if (sellerRows.length > 0) {
    const sellerId = sellerRows[0].id;
    for (const np of newProducts) {
      await p.query(
        'INSERT IGNORE INTO products (id, seller_id, name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [np.id, sellerId, np.name, np.description, np.price, np.image, np.category, np.stock]
      );
    }
  }
}

async function getUserByEmailAndRole(email, password, role) {
  const p = getPool();
  const [rows] = await p.query(
    'SELECT id, email, role, name FROM users WHERE email = ? AND password = ? AND role = ?',
    [email, password, role]
  );
  if (!rows[0]) return null;
  return { ...rows[0], id: String(rows[0].id) };
}

function getPool() {
  if (!pool) initDb();
  return pool;
}

async function getProducts() {
  const p = getPool();
  const [rows] = await p.query('SELECT id, seller_id as sellerId, name, description, price, image, category, stock FROM products');
  return rows.map(r => ({ id: String(r.id), sellerId: String(r.sellerId), name: r.name, description: r.description, price: Number(r.price), image: r.image, category: r.category, stock: Number(r.stock) }));
}

async function getProductById(id) {
  const p = getPool();
  const [rows] = await p.query('SELECT id, seller_id as sellerId, name, description, price, image, category, stock FROM products WHERE id = ?', [id]);
  const r = rows[0];
  return r ? { id: String(r.id), sellerId: String(r.sellerId), name: r.name, description: r.description, price: Number(r.price), image: r.image, category: r.category, stock: Number(r.stock) } : null;
}

async function addProduct(product) {
  const p = getPool();
  await p.query('INSERT INTO products (id, seller_id, name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [product.id, product.sellerId, product.name, product.description, product.price, product.image, product.category, product.stock]);
}

async function updateProduct(id, updates) {
  const p = getPool();
  const fields = [];
  const values = [];
  for (const key of Object.keys(updates)) {
    fields.push(`${key === 'sellerId' ? 'seller_id' : key} = ?`);
    values.push(updates[key]);
  }
  if (fields.length === 0) return;
  values.push(id);
  await p.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
}

async function deleteProduct(id) {
  const p = getPool();
  await p.query('DELETE FROM products WHERE id = ?', [id]);
}

async function getDeliveryPersonnel() {
  const p = getPool();
  const [rows] = await p.query('SELECT id, name, email, status, current_orders as currentOrders FROM delivery_personnel');
  return rows.map(r => ({ id: String(r.id), name: r.name, email: r.email, status: r.status, currentOrders: Number(r.currentOrders) }));
}

async function updateDeliveryStatus(deliveryPersonId, status) {
  const p = getPool();
  await p.query('UPDATE delivery_personnel SET status = ? WHERE id = ?', [status, deliveryPersonId]);
}

async function getOrders() {
  const p = getPool();
  const [ordersRows] = await p.query('SELECT id, customer_id as customerId, customer_name as customerName, customer_email as customerEmail, total_amount as totalAmount, delivery_person_id as deliveryPersonId, delivery_person_name as deliveryPersonName, status, address, created_at as createdAt FROM orders');
  const orders = [];
  for (const r of ordersRows) {
    const [itemsRows] = await p.query('SELECT product_id as productId, product_name as productName, quantity, price FROM order_items WHERE order_id = ?', [r.id]);
    const products = itemsRows.map(it => ({ productId: String(it.productId), productName: it.productName, quantity: Number(it.quantity), price: Number(it.price) }));
    orders.push({ id: String(r.id), customerId: String(r.customerId), customerName: r.customerName, customerEmail: r.customerEmail, products, totalAmount: Number(r.totalAmount), deliveryPersonId: r.deliveryPersonId ? String(r.deliveryPersonId) : undefined, deliveryPersonName: r.deliveryPersonName ?? undefined, status: r.status, address: r.address, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null });
  }
  return orders;
}

// Convert ISO 8601 (e.g. '2026-02-28T12:12:28.238Z') to MySQL DATETIME ('2026-02-28 12:12:28')
function toMysqlDatetime(isoStr) {
  if (!isoStr) return null;
  return new Date(isoStr).toISOString().slice(0, 19).replace('T', ' ');
}

async function addOrder(order) {
  const p = getPool();
  await p.query('INSERT INTO orders (id, customer_id, customer_name, customer_email, total_amount, delivery_person_id, delivery_person_name, status, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [order.id, order.customerId, order.customerName, order.customerEmail, order.totalAmount, order.deliveryPersonId ?? null, order.deliveryPersonName ?? null, order.status, order.address, toMysqlDatetime(order.createdAt)]);
  for (const item of order.products) {
    await p.query('INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)', [order.id, item.productId, item.productName, item.quantity, item.price]);
    // Decrement stock, floor at 0
    await p.query('UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?', [item.quantity, item.productId]);
  }
}

async function updateOrder(id, updates) {
  const p = getPool();
  const fields = [];
  const values = [];
  const mapping = { customerId: 'customer_id', customerName: 'customer_name', customerEmail: 'customer_email', totalAmount: 'total_amount', deliveryPersonId: 'delivery_person_id', deliveryPersonName: 'delivery_person_name', status: 'status', address: 'address', createdAt: 'created_at' };
  for (const key of Object.keys(updates)) {
    if (key === 'products') continue;
    const dbKey = mapping[key] ?? key;
    fields.push(`${dbKey} = ?`);
    const val = (key === 'createdAt') ? toMysqlDatetime(updates[key]) : updates[key];
    values.push(val);
  }
  if (fields.length > 0) {
    values.push(id);
    await p.query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);
  }
  if (updates.products) {
    await p.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    for (const item of updates.products) {
      await p.query('INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)', [id, item.productId, item.productName, item.quantity, item.price]);
    }
  }
}

async function assignDeliveryPerson(orderId, deliveryPersonId) {
  const p = getPool();
  const [dpRows] = await p.query('SELECT id, name, email, current_orders as currentOrders FROM delivery_personnel WHERE id = ?', [deliveryPersonId]);
  const dp = dpRows[0];
  if (!dp) return false;
  await p.query('UPDATE orders SET delivery_person_id = ?, delivery_person_name = ?, status = ? WHERE id = ?', [deliveryPersonId, dp.name, 'assigned', orderId]);
  await p.query('UPDATE delivery_personnel SET current_orders = current_orders + 1 WHERE id = ?', [deliveryPersonId]);
  return { ok: true, email: dp.email, name: dp.name };
}

async function createUser({ name, email, password, role }) {
  const p = getPool();
  // Check for duplicate email
  const [existing] = await p.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) return null; // email already taken
  const [result] = await p.query(
    'INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)',
    [email, password, role, name]
  );
  const id = String(result.insertId);
  // If delivery role, also add to delivery_personnel table
  if (role === 'delivery') {
    await p.query(
      'INSERT INTO delivery_personnel (name, email, status, current_orders) VALUES (?, ?, ?, ?)',
      [name, email, 'offline', 0]
    );
  }
  return { id, email, role, name };
}

module.exports = {
  initDb,
  createTables,
  seedData,
  getUserByEmailAndRole,
  createUser,
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getDeliveryPersonnel,
  updateDeliveryStatus,
  getOrders,
  addOrder,
  updateOrder,
  assignDeliveryPerson,
};
