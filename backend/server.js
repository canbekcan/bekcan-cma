require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.set('trust proxy', 1); // Trust Nginx reverse proxy
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_please_change';


const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security Middlewares
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:", "http:"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    connectSrc: ["'self'", "http://localhost:4000", "https://conf.bekcan.com"]
  }
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: { error: 'Too many requests from this IP' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 login requests per window
  message: { error: 'Too many login attempts, please try again later' }
});

app.use('/api/', apiLimiter);
app.post('/api/auth/login', authLimiter);

app.use(cors());

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend/public')));
// Serve admin panel static files under /admin
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));

const pool = new Pool({
  user: process.env.DB_USER || 'db_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'db_name',
  password: process.env.DB_PASSWORD || 'db_password',
  port: process.env.DB_PORT || 5432,
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ========================
// API: AUTH
// ========================
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, conference_id: user.conference_id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role, conference_id: user.conference_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================
// API: PUBLIC CONFERENCE DATA
// ========================

// GET All Conferences (Public)
app.get('/api/conferences', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, slug, name, start_date, end_date, venue_info FROM conferences ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/conferences/:slug/schedule', async (req, res) => {
  const { slug } = req.params;
  try {
    const confRes = await pool.query('SELECT * FROM conferences WHERE slug = $1', [slug]);
    if (confRes.rows.length === 0) return res.status(404).json({ error: 'Conference not found' });
    const conference = confRes.rows[0];

    const speakersRes = await pool.query('SELECT * FROM speakers WHERE conference_id = $1', [conference.id]);
    const sessionsRes = await pool.query('SELECT * FROM sessions WHERE conference_id = $1 ORDER BY start_time ASC', [conference.id]);
    const relationsRes = await pool.query(`
      SELECT ss.session_id, ss.speaker_id, s.session_ref, sp.speaker_ref 
      FROM session_speakers ss
      JOIN sessions s ON ss.session_id = s.id
      JOIN speakers sp ON ss.speaker_id = sp.id
      WHERE s.conference_id = $1
    `, [conference.id]);

    // Format like the old schedule.json
    const datesSet = new Set();
    const formattedSessions = sessionsRes.rows.map(s => {
      // Find speakers for this session
      const s_speakers = relationsRes.rows.filter(r => r.session_id === s.id).map(r => r.speaker_ref);
      
      const startDate = new Date(s.start_time);
      const startStr = startDate.toISOString().split('T')[0];
      datesSet.add(startStr);

      return {
        id: s.session_ref,
        start: s.start_time,
        end: s.end_time,
        title_tr: s.title_tr,
        title_en: s.title_en,
        description_tr: s.description_tr,
        description_en: s.description_en,
        room: s.room,
        category: s.category,
        speaker_ids: s_speakers
      };
    });

    const formattedSpeakers = speakersRes.rows.map(sp => ({
      id: sp.speaker_ref,
      name: sp.full_name,
      title: sp.title,
      title_tr: sp.title,
      title_en: sp.title,
      institution: sp.institution,
      institution_tr: sp.institution,
      institution_en: sp.institution,
      bio: sp.bio,
      bio_tr: sp.bio,
      bio_en: sp.bio,
      email: sp.email,
      phone: sp.phone,
      avatar: sp.avatar_url
    }));

    res.json({
      conference: {
        id: conference.id,
        name: conference.name,
        dates: Array.from(datesSet).sort(),
        venue: { address: conference.venue_info },
        wifi: { ssid: conference.wifi_ssid, password: conference.wifi_wpa }
      },
      speakers: formattedSpeakers,
      sessions: formattedSessions
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Attendee Registration
app.post('/api/conferences/:slug/attendee', async (req, res) => {
  const { slug } = req.params;
  const { device_id, full_name, title, institution, email, phone } = req.body;
  if (!device_id || !full_name) return res.status(400).json({ error: 'Missing required fields' });
  
  try {
    const confRes = await pool.query('SELECT id FROM conferences WHERE slug = $1', [slug]);
    if (confRes.rows.length === 0) return res.status(404).json({ error: 'Conference not found' });
    const conf_id = confRes.rows[0].id;

    const query = `
      INSERT INTO attendees (device_id, conference_id, full_name, title, institution, email, phone, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (device_id, conference_id) 
      DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        title = EXCLUDED.title,
        institution = EXCLUDED.institution,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        updated_at = CURRENT_TIMESTAMP
    `;
    await pool.query(query, [device_id, conf_id, full_name, title, institution, email, phone]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ========================
// API: ADMIN ROUTES (CRUD)
// ========================

// GET Conferences
app.get('/api/admin/conferences', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM conferences ORDER BY id DESC';
    let params = [];
    if (req.user.role !== 'superadmin') {
      query = 'SELECT * FROM conferences WHERE id = $1';
      params = [req.user.conference_id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE Conference (Superadmin only)
app.post('/api/admin/conferences', authenticateToken, async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { slug, name, start_date, end_date, venue_info, wifi_ssid, wifi_wpa } = req.body;
  const startDateVal = start_date === '' ? null : start_date;
  const endDateVal = end_date === '' ? null : end_date;
  try {
    const result = await pool.query(
      'INSERT INTO conferences (slug, name, start_date, end_date, venue_info, wifi_ssid, wifi_wpa) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [slug, name, startDateVal, endDateVal, venue_info, wifi_ssid, wifi_wpa]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE Conference
app.delete('/api/admin/conferences/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await pool.query('DELETE FROM conferences WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE User (Superadmin only)
app.post('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  const { username, password, role, conference_id } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role, conference_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role',
      [username, hash, role, conference_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// IMPORT JSON Schedule for a Conference
app.post('/api/admin/conferences/:id/import-json', authenticateToken, async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const data = req.body; // Expects JSON identical to schedule.json structure
  try {
    await pool.query('BEGIN');
    
    // Clear existing data for this conference
    await pool.query('DELETE FROM sessions WHERE conference_id = $1', [confId]);
    await pool.query('DELETE FROM speakers WHERE conference_id = $1', [confId]);

    // Insert speakers
    if (data.speakers) {
      for (const sp of data.speakers) {
        await pool.query(
          "INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, phone, bio, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [
            confId,
            sp.id,
            sp.name,
            sp.title_tr || sp.title || '',
            sp.institution_tr || sp.institution || '',
            sp.contact || sp.email || '',
            sp.phone || '',
            sp.bio_tr || sp.bio || '',
            sp.avatar || sp.avatar_url || ''
          ]
        );
      }
    }

    // Insert sessions
    if (data.sessions) {
      for (const sess of data.sessions) {
        const sessInsert = await pool.query(
          "INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
          [confId, sess.id, sess.title_tr, sess.title_en, sess.description_tr, sess.description_en, sess.start || null, sess.end || null, sess.room, sess.category]
        );
        const sessId = sessInsert.rows[0].id;

        // Insert session_speakers
        if (sess.speaker_ids) {
          for (const sp_ref of sess.speaker_ids) {
            const spCheck = await pool.query("SELECT id FROM speakers WHERE conference_id = $1 AND speaker_ref = $2", [confId, sp_ref]);
            if (spCheck.rows.length > 0) {
              await pool.query("INSERT INTO session_speakers (session_id, speaker_id) VALUES ($1, $2)", [sessId, spCheck.rows[0].id]);
            }
          }
        }
      }
    }
    
    await pool.query('COMMIT');
    res.json({ success: true, message: 'Data imported successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ========================
// API: CRUD SPEAKERS
// ========================
app.get('/api/admin/conferences/:id/speakers', authenticateToken, async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await pool.query('SELECT * FROM speakers WHERE conference_id = $1 ORDER BY id DESC', [confId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/conferences/:id/speakers', authenticateToken, async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) return res.status(403).json({ error: 'Forbidden' });
  const { speaker_ref, full_name, title, institution, email, phone, bio, avatar_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, phone, bio, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [confId, speaker_ref, full_name, title, institution, email, phone, bio, avatar_url]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/speakers/:id', authenticateToken, async (req, res) => {
  try {
    // Check permission
    const check = await pool.query('SELECT conference_id FROM speakers WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(check.rows[0].conference_id)) return res.status(403).json({ error: 'Forbidden' });
    
    await pool.query('DELETE FROM speakers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ========================
// API: CRUD SESSIONS
// ========================
app.get('/api/admin/conferences/:id/sessions', authenticateToken, async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const sessionsRes = await pool.query('SELECT * FROM sessions WHERE conference_id = $1 ORDER BY start_time ASC', [confId]);
    const relationsRes = await pool.query(`
      SELECT ss.session_id, sp.speaker_ref 
      FROM session_speakers ss
      JOIN sessions s ON ss.session_id = s.id
      JOIN speakers sp ON ss.speaker_id = sp.id
      WHERE s.conference_id = $1
    `, [confId]);
    
    const formatted = sessionsRes.rows.map(s => {
      s.speaker_ids = relationsRes.rows.filter(r => r.session_id === s.id).map(r => r.speaker_ref);
      return s;
    });
    res.json(formatted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/conferences/:id/sessions', authenticateToken, async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) return res.status(403).json({ error: 'Forbidden' });
  const { session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category, speaker_ids } = req.body;
  const startTimeVal = start_time === '' ? null : start_time;
  const endTimeVal = end_time === '' ? null : end_time;
  try {
    await pool.query('BEGIN');
    const sessInsert = await pool.query(
      'INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [confId, session_ref, title_tr, title_en, description_tr, description_en, startTimeVal, endTimeVal, room, category]
    );
    const newSession = sessInsert.rows[0];
    
    if (speaker_ids && Array.isArray(speaker_ids)) {
      for (const sp_ref of speaker_ids) {
        const spCheck = await pool.query("SELECT id FROM speakers WHERE conference_id = $1 AND speaker_ref = $2", [confId, sp_ref]);
        if (spCheck.rows.length > 0) {
          await pool.query("INSERT INTO session_speakers (session_id, speaker_id) VALUES ($1, $2)", [newSession.id, spCheck.rows[0].id]);
        }
      }
    }
    await pool.query('COMMIT');
    newSession.speaker_ids = speaker_ids || [];
    res.json(newSession);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const check = await pool.query('SELECT conference_id FROM sessions WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(check.rows[0].conference_id)) return res.status(403).json({ error: 'Forbidden' });
    
    await pool.query('DELETE FROM sessions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Attendees
app.get('/api/admin/attendees', authenticateToken, async (req, res) => {
  try {
    let query = 'SELECT * FROM attendees ORDER BY created_at DESC';
    let params = [];
    if (req.user.role !== 'superadmin') {
      query = 'SELECT * FROM attendees WHERE conference_id = $1 ORDER BY created_at DESC';
      params = [req.user.conference_id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});



// Fallback routing for API Docs
app.get(/^\/api-docs/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/api-docs.html'));
});

// Fallback routing for Admin
app.get(/^\/admin/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});

// Explicit routing for Root (Landing Page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Subdomain/Path based UI for specific conference (e.g. /bekcan2026)
app.get('/:slug', (req, res, next) => {
  const { slug } = req.params;
  if (slug.includes('.') || ['api', 'admin', 'api-docs'].includes(slug)) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/public/schedule.html'));
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
