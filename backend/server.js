require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./config/database');
const { MAX_FILE_MB } = require('./middleware/uploads');
const app = express();
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(value => value.trim());
if (!process.env.PUBLIC_API_URL) throw new Error('PUBLIC_API_URL is required. See backend/.env.example.');
app.disable('x-powered-by');
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '64kb' }));
app.use((req, res, next) => { res.set('X-Content-Type-Options', 'nosniff'); next(); });
app.get('/', (req, res) => res.json({ service: 'Smart Study Hub API', health: '/api/health', databaseReadiness: '/api/ready' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/ready', async (req, res) => {
  try { await db.ready(); res.json({ status: 'ready', database: 'postgresql' }); }
  catch { res.status(503).json({ status: 'unavailable' }); }
});
app.use('/api/resources', require('./routes/resources'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/discussions', require('./routes/discussions'));
app.use('/api/ai', require('./routes/ai'));
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const uploadError = typeof error.code === 'string' && error.code.startsWith('LIMIT_');
  const status = uploadError ? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 400) : error.status || 500;
  res.status(status).json({ error: uploadError ? `Upload exceeds allowed size or field count. Maximum one PDF, DOCX or PPTX file, ${MAX_FILE_MB} MB.` : status < 500 ? error.message : 'An unexpected server error occurred.' });
});
if (require.main === module) app.listen(process.env.PORT || 5000, () => console.log('Smart Study Hub API started.'));
module.exports = app;
