import 'dotenv/config';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dishes as starterDishes } from './src/data/dishes.js';

const require = createRequire(import.meta.url);
const jsonServer = require('json-server');
const jsonServerAuth = require('json-server-auth');
const bcrypt = require('bcryptjs');
const authConstants = require('json-server-auth/dist/constants');

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || !process.env.ADMIN_PASSWORD || !process.env.CORS_ORIGINS)) {
  throw new Error('Production requires JWT_SECRET, ADMIN_PASSWORD, and CORS_ORIGINS environment variables.');
}
authConstants.JWT_SECRET_KEY = process.env.JWT_SECRET || 'bungoiangi-local-development-secret';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const databasePath = resolve(process.env.DATABASE_PATH || `${projectRoot}/server/db.json`);
const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@bungoiangi.com').trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
const allowedOrigins = new Set(String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean));

if (!existsSync(databasePath)) {
  mkdirSync(dirname(databasePath), { recursive: true });
  writeFileSync(databasePath, JSON.stringify({
    users: [],
    dishes: starterDishes,
    favorites: [],
    history: [],
  }, null, 2));
}

const app = jsonServer.create();
const router = jsonServer.router(databasePath);
const db = router.db;
app.db = db;

for (const collection of ['users', 'dishes', 'favorites', 'history']) {
  if (!Array.isArray(db.get(collection).value())) db.set(collection, []).write();
}

function nextId(collection) {
  return db.get(collection).map('id').value().reduce((maximum, id) => Math.max(maximum, Number(id) || 0), 0) + 1;
}

const configuredAdmin = db.get('users').find(user => String(user.email).toLowerCase() === adminEmail).value();
if (!configuredAdmin) {
  db.get('users').push({
    id: nextId('users'),
    name: 'Quản trị viên',
    email: adminEmail,
    password: bcrypt.hashSync(adminPassword, 10),
    role: 'admin',
    createdAt: new Date().toISOString(),
  }).write();
} else if (configuredAdmin.role !== 'admin') {
  db.get('users').find({ id: configuredAdmin.id }).assign({ role: 'admin' }).write();
}

function safeUser(user) {
  if (!user) return null;
  const { password, ...publicUser } = user;
  return publicUser;
}

function normalizeDishName(name) {
  return String(name || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

function userFromRequest(req) {
  const subject = req.claims?.sub;
  if (!subject) return null;
  return db.get('users').find(user => String(user.id) === String(subject)).value() || null;
}

function unauthorized(res) {
  res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
}

function forbidden(res) {
  res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này.' });
}

function validateDish(input, previous = {}) {
  const name = String(input.name ?? previous.name ?? '').trim();
  const price = Number(input.price ?? previous.price);
  if (name.length < 2 || !Number.isFinite(price) || price < 0) return null;

  return {
    ...previous,
    name,
    desc: String(input.desc ?? previous.desc ?? '').trim(),
    price,
    calo: Number(input.calo ?? previous.calo ?? 0),
    category: String(input.category ?? previous.category ?? 'all'),
    type: String(input.type ?? previous.type ?? 'man'),
    diet: String(input.diet ?? previous.diet ?? input.type ?? previous.type ?? 'man'),
    tags: Array.isArray(input.tags) ? input.tags : (previous.tags || []),
    img: String(input.img ?? previous.img ?? ''),
    rating: Number(input.rating ?? previous.rating ?? 0),
    time: String(input.time ?? previous.time ?? ''),
    popular: Boolean(input.popular ?? previous.popular ?? false),
  };
}

function adminStats() {
  const allDishes = db.get('dishes').value();
  const favorites = db.get('favorites').value();
  const history = db.get('history').value();
  const hotDishes = allDishes.map(dish => ({
    id: dish.id,
    name: dish.name,
    img: dish.img,
    favorites: favorites.filter(item => Number(item.dishId) === Number(dish.id)).length,
    views: history.filter(item => Number(item.dishId) === Number(dish.id)).length,
  })).sort((left, right) => (right.favorites * 2 + right.views) - (left.favorites * 2 + left.views)).slice(0, 5);

  return {
    userCount: db.get('users').size().value(),
    dishCount: allDishes.length,
    favoriteCount: favorites.length,
    historyCount: history.length,
    hotDishes,
  };
}

function handleAdminApi(req, res, user) {
  const parts = req.path.split('/').filter(Boolean).slice(2);
  const [resource, idPart] = parts;

  if (resource === 'stats' && req.method === 'GET') {
    res.json(adminStats());
    return;
  }

  if (resource === 'dishes') {
    const dishId = Number(idPart);
    if (!idPart && req.method === 'GET') {
      res.json(db.get('dishes').value());
      return;
    }
    if (!idPart && req.method === 'POST') {
      const dish = validateDish(req.body || {});
      if (!dish) return res.status(400).json({ message: 'Tên món và giá hợp lệ là bắt buộc.' });
      const duplicate = db.get('dishes').find(item => normalizeDishName(item.name) === normalizeDishName(dish.name)).value();
      if (duplicate) return res.status(409).json({ message: 'Món ăn đã tồn tại.' });
      dish.id = nextId('dishes');
      db.get('dishes').push(dish).write();
      res.status(201).json(dish);
      return;
    }
    const existing = db.get('dishes').find({ id: dishId }).value();
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy món ăn.' });
    if (req.method === 'PATCH') {
      const updated = validateDish(req.body || {}, existing);
      if (!updated) return res.status(400).json({ message: 'Tên món và giá hợp lệ là bắt buộc.' });
      const duplicate = db.get('dishes').find(item => Number(item.id) !== dishId && normalizeDishName(item.name) === normalizeDishName(updated.name)).value();
      if (duplicate) return res.status(409).json({ message: 'Món ăn đã tồn tại.' });
      db.get('dishes').find({ id: dishId }).assign(updated).write();
      res.json(updated);
      return;
    }
    if (req.method === 'DELETE') {
      db.get('dishes').remove({ id: dishId }).write();
      db.set('favorites', db.get('favorites').filter(item => Number(item.dishId) !== dishId).value()).write();
      res.status(204).end();
      return;
    }
  }

  if (resource === 'users') {
    const users = db.get('users');
    const userId = Number(idPart);
    if (!idPart && req.method === 'GET') {
      res.json(users.value().map(safeUser));
      return;
    }
    if (!idPart && req.method === 'POST') {
      const name = String(req.body?.name || '').trim();
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = String(req.body?.password || '');
      const role = req.body?.role === 'admin' ? 'admin' : 'customer';
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
        return res.status(400).json({ message: 'Tên, email hợp lệ và mật khẩu tối thiểu 8 ký tự là bắt buộc.' });
      }
      if (users.find(item => String(item.email).toLowerCase() === email).value()) {
        return res.status(409).json({ message: 'Email đã tồn tại.' });
      }
      const created = {
        id: nextId('users'), name, email, role,
        password: bcrypt.hashSync(password, 10),
        createdAt: new Date().toISOString(),
      };
      users.push(created).write();
      res.status(201).json(safeUser(created));
      return;
    }
    const existing = users.find({ id: userId }).value();
    if (!existing) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    if (req.method === 'PATCH') {
      const changes = {};
      if (typeof req.body?.name === 'string' && req.body.name.trim().length >= 2) changes.name = req.body.name.trim();
      if (['admin', 'customer'].includes(req.body?.role)) changes.role = req.body.role;
      if (Object.keys(changes).length === 0) return res.status(400).json({ message: 'Không có thay đổi hợp lệ.' });
      if (existing.role === 'admin' && changes.role === 'customer' && users.filter({ role: 'admin' }).size().value() <= 1) {
        return res.status(400).json({ message: 'Không thể hạ quyền admin duy nhất.' });
      }
      const updated = users.find({ id: userId }).assign(changes).write();
      res.json(safeUser(updated));
      return;
    }
    if (req.method === 'DELETE') {
      if (Number(user.id) === userId) return res.status(400).json({ message: 'Không thể xóa tài khoản admin đang sử dụng.' });
      users.remove({ id: userId }).write();
      db.set('favorites', db.get('favorites').filter(item => Number(item.userId) !== userId).value()).write();
      db.set('history', db.get('history').filter(item => Number(item.userId) !== userId).value()).write();
      res.status(204).end();
      return;
    }
  }

  res.status(405).json({ message: 'Phương thức hoặc tài nguyên admin không được hỗ trợ.' });
}

function handleCustomerApi(req, res, user) {
  const parts = req.path.split('/').filter(Boolean).slice(2);
  const [resource] = parts;
  const userId = Number(user.id);

  if (resource === 'favorites') {
    if (req.method === 'GET') {
      const dishIds = db.get('favorites').filter({ userId }).map('dishId').value();
      res.json({ dishIds });
      return;
    }
    if (req.method === 'PUT') {
      const requestedIds = Array.isArray(req.body?.dishIds) ? req.body.dishIds.map(Number) : [];
      const validIds = [...new Set(requestedIds)].filter(id => db.get('dishes').find({ id }).value());
      const remaining = db.get('favorites').filter(item => Number(item.userId) !== userId).value();
      const records = validIds.map(dishId => ({ userId, dishId, createdAt: new Date().toISOString() }));
      db.set('favorites', [...remaining, ...records]).write();
      res.json({ dishIds: validIds });
      return;
    }
  }

  if (resource === 'history') {
    if (req.method === 'GET') {
      const history = db.get('history').filter({ userId }).value().slice(-50).reverse().map(item => ({
        ...item,
        dish: db.get('dishes').find({ id: Number(item.dishId) }).value() || null,
      }));
      res.json(history);
      return;
    }
    if (req.method === 'POST') {
      const dishId = Number(req.body?.dishId);
      const dish = db.get('dishes').find({ id: dishId }).value();
      if (!dish) return res.status(404).json({ message: 'Không tìm thấy món ăn.' });
      const entry = { id: nextId('history'), userId, dishId, viewedAt: new Date().toISOString() };
      const ownHistory = db.get('history').filter(item => Number(item.userId) === userId).value();
      const otherHistory = db.get('history').filter(item => Number(item.userId) !== userId).value();
      db.set('history', [...otherHistory, ...ownHistory.slice(-49), entry]).write();
      res.status(201).json({ ...entry, dish });
      return;
    }
  }

  res.status(405).json({ message: 'Phương thức hoặc tài nguyên khách hàng không được hỗ trợ.' });
}

app.use(jsonServer.defaults({ noCors: true }));
app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && allowedOrigins.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Accept,Authorization,Content-Type');
  }

  if (req.method === 'OPTIONS') {
    res.status(!origin || allowedOrigins.has(origin) ? 204 : 403).end();
    return;
  }

  next();
});
app.use(jsonServer.bodyParser);
app.use((req, _res, next) => {
  if (req.method === 'POST' && ['/register', '/signup', '/users'].includes(req.path)) {
    req.body.email = String(req.body.email || '').trim().toLowerCase();
    req.body.role = 'customer';
  }
  next();
});
app.use(jsonServerAuth);

app.use((req, res, next) => {
  if (req.path === '/health' && req.method === 'GET') {
    res.json({ ok: true });
    return;
  }

  if (/^\/(users|dishes|favorites|history)(\/|$)/.test(req.path)) {
    res.status(404).json({ message: 'Hãy dùng API được phân quyền.' });
    return;
  }

  if (req.path === '/api/dishes' && req.method === 'GET') {
    res.json(db.get('dishes').value());
    return;
  }

  if (req.path === '/api/me') {
    const user = userFromRequest(req);
    if (!user) return unauthorized(res);
    if (req.method === 'GET') {
      res.json(safeUser(user));
      return;
    }
    if (req.method === 'PATCH') {
      const name = String(req.body?.name || '').trim();
      if (name.length < 2) return res.status(400).json({ message: 'Tên phải có ít nhất 2 ký tự.' });
      const updated = db.get('users').find({ id: user.id }).assign({ name }).write();
      res.json(safeUser(updated));
      return;
    }
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ.' });
  }

  if (req.path.startsWith('/api/admin/')) {
    const user = userFromRequest(req);
    if (!user) return unauthorized(res);
    if (user.role !== 'admin') return forbidden(res);
    handleAdminApi(req, res, user);
    return;
  }

  if (req.path.startsWith('/api/customer/')) {
    const user = userFromRequest(req);
    if (!user) return unauthorized(res);
    handleCustomerApi(req, res, user);
    return;
  }

  next();
});

app.use(router);

const port = Number(process.env.PORT || process.env.API_PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
  console.log(`BungOiAnGi API listening on http://${host}:${port}`);
  console.log(`Admin account: ${adminEmail}`);
});