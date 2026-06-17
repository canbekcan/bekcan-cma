/**
 * File: backend/routes/admin.js
 * Description: Admin CRUD routes for Conferences, Speakers, Sessions, Users, and Attendees.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Protect all admin routes
router.use(authenticateToken);

// ==============================================
// 1. CONFERENCES CRUD
// ==============================================

// GET /api/admin/conferences
router.get('/conferences', async (req, res) => {
  try {
    let query = 'SELECT * FROM conferences ORDER BY id DESC';
    let params = [];
    if (req.user.role !== 'superadmin') {
      query = 'SELECT * FROM conferences WHERE id = $1';
      params = [req.user.conference_id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[Admin API] Fetch conferences error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/conferences (Superadmin only)
router.post('/conferences', async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden: Requires superadmin role' });
  }
  const { slug, name, abbreviation, start_date, end_date, venue_info, wifi_ssid, wifi_wpa, logo_url } = req.body;
  const startDateVal = start_date === '' ? null : start_date;
  const endDateVal = end_date === '' ? null : end_date;
  
  try {
    const result = await pool.query(
      'INSERT INTO conferences (slug, name, abbreviation, start_date, end_date, venue_info, wifi_ssid, wifi_wpa, logo_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [slug, name, abbreviation || null, startDateVal, endDateVal, venue_info, wifi_ssid, wifi_wpa, logo_url || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Admin API] Create conference error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/conferences/:id (Superadmin only)
router.delete('/conferences/:id', async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden: Requires superadmin role' });
  }
  try {
    await pool.query('DELETE FROM conferences WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin API] Delete conference error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/conferences/:id
router.get('/conferences/:id', async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const result = await pool.query('SELECT * FROM conferences WHERE id = $1', [confId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conference not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Admin API] Fetch conference details error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/conferences/:id
router.put('/conferences/:id', async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { slug, name, abbreviation, start_date, end_date, venue_info, wifi_ssid, wifi_wpa, logo_url } = req.body;
  const startDateVal = start_date === '' ? null : start_date;
  const endDateVal = end_date === '' ? null : end_date;
  try {
    const result = await pool.query(
      'UPDATE conferences SET slug = $1, name = $2, abbreviation = $3, start_date = $4, end_date = $5, venue_info = $6, wifi_ssid = $7, wifi_wpa = $8, logo_url = $9 WHERE id = $10 RETURNING *',
      [slug, name, abbreviation || null, startDateVal, endDateVal, venue_info, wifi_ssid, wifi_wpa, logo_url || null, confId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Admin API] Update conference error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================
// 2. USERS CRUD
// ==============================================

// POST /api/admin/users (Superadmin only)
router.post('/users', async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden: Requires superadmin role' });
  }
  const { username, password, role, conference_id } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role, conference_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role',
      [username, hash, role, conference_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Admin API] Create user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden: Requires superadmin role' });
  }
  const { conference_id } = req.query;
  try {
    let query = 'SELECT id, username, role, conference_id, created_at FROM users';
    let params = [];
    if (conference_id) {
      query += ' WHERE conference_id = $1';
      params = [conference_id];
    }
    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[Admin API] Fetch users error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Forbidden: Requires superadmin role' });
  }
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin API] Delete user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================
// 3. SPEAKERS CRUD
// ==============================================

// GET /api/admin/conferences/:id/speakers
router.get('/conferences/:id/speakers', async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const result = await pool.query('SELECT * FROM speakers WHERE conference_id = $1 ORDER BY id DESC', [confId]);
    res.json(result.rows);
  } catch (err) {
    console.error('[Admin API] Fetch speakers error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/conferences/:id/speakers
router.post('/conferences/:id/speakers', async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { speaker_ref, full_name, title, institution, email, phone, bio, avatar_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO speakers (conference_id, speaker_ref, full_name, title, institution, email, phone, bio, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [confId, speaker_ref, full_name, title, institution, email, phone, bio, avatar_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Admin API] Create speaker error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/speakers/:id
router.delete('/speakers/:id', async (req, res) => {
  try {
    const check = await pool.query('SELECT conference_id FROM speakers WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Speaker not found' });
    }
    if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(check.rows[0].conference_id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await pool.query('DELETE FROM speakers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin API] Delete speaker error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/speakers/:id
router.put('/speakers/:id', async (req, res) => {
  const { speaker_ref, full_name, title, institution, email, phone, bio, avatar_url } = req.body;
  try {
    const check = await pool.query('SELECT conference_id FROM speakers WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Speaker not found' });
    }
    if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(check.rows[0].conference_id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const result = await pool.query(
      'UPDATE speakers SET speaker_ref = $1, full_name = $2, title = $3, institution = $4, email = $5, phone = $6, bio = $7, avatar_url = $8 WHERE id = $9 RETURNING *',
      [speaker_ref, full_name, title, institution, email, phone, bio, avatar_url, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Admin API] Update speaker error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================
// 4. SESSIONS CRUD
// ==============================================

// GET /api/admin/conferences/:id/sessions
router.get('/conferences/:id/sessions', async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
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
  } catch (err) {
    console.error('[Admin API] Fetch sessions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/conferences/:id/sessions
router.post('/conferences/:id/sessions', async (req, res) => {
  const confId = req.params.id;
  if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
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
    console.error('[Admin API] Create session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/sessions/:id
router.delete('/sessions/:id', async (req, res) => {
  try {
    const check = await pool.query('SELECT conference_id FROM sessions WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(check.rows[0].conference_id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await pool.query('DELETE FROM sessions WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin API] Delete session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/sessions/:id
router.put('/sessions/:id', async (req, res) => {
  const { session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category, speaker_ids } = req.body;
  const startTimeVal = start_time === '' ? null : start_time;
  const endTimeVal = end_time === '' ? null : end_time;
  try {
    const check = await pool.query('SELECT conference_id FROM sessions WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const confId = check.rows[0].conference_id;
    if (req.user.role !== 'superadmin' && String(req.user.conference_id) !== String(confId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await pool.query('BEGIN');
    const sessUpdate = await pool.query(
      'UPDATE sessions SET session_ref = $1, title_tr = $2, title_en = $3, description_tr = $4, description_en = $5, start_time = $6, end_time = $7, room = $8, category = $9 WHERE id = $10 RETURNING *',
      [session_ref, title_tr, title_en, description_tr, description_en, startTimeVal, endTimeVal, room, category, req.params.id]
    );
    
    await pool.query('DELETE FROM session_speakers WHERE session_id = $1', [req.params.id]);
    
    if (speaker_ids && Array.isArray(speaker_ids)) {
      for (const sp_ref of speaker_ids) {
        const spCheck = await pool.query("SELECT id FROM speakers WHERE conference_id = $1 AND speaker_ref = $2", [confId, sp_ref]);
        if (spCheck.rows.length > 0) {
          await pool.query("INSERT INTO session_speakers (session_id, speaker_id) VALUES ($1, $2)", [req.params.id, spCheck.rows[0].id]);
        }
      }
    }
    await pool.query('COMMIT');
    
    const updatedSession = sessUpdate.rows[0];
    updatedSession.speaker_ids = speaker_ids || [];
    res.json(updatedSession);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('[Admin API] Update session error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==============================================
// 5. ATTENDEES LIST
// ==============================================

// GET /api/admin/attendees
router.get('/attendees', async (req, res) => {
  try {
    let query = 'SELECT * FROM attendees ORDER BY created_at DESC';
    let params = [];
    if (req.user.role !== 'superadmin') {
      query = 'SELECT * FROM attendees WHERE conference_id = $1 ORDER BY created_at DESC';
      params = [req.user.conference_id];
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('[Admin API] Fetch attendees error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
