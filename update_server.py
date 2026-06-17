import re

with open('backend/server.js', 'r', encoding='utf-8') as f:
    content = f.read()

new_routes = """
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
  try {
    await pool.query('BEGIN');
    const sessInsert = await pool.query(
      'INSERT INTO sessions (conference_id, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [confId, session_ref, title_tr, title_en, description_tr, description_en, start_time, end_time, room, category]
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
"""

content = content.replace('// GET Attendees\n', new_routes)

# Also add fallback route for /api-docs to api-docs.html
docs_route = """// Fallback routing for API Docs
app.get('/api-docs*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/api-docs.html'));
});

// Fallback routing for Admin"""

content = content.replace('// Fallback routing for Admin', docs_route)

with open('backend/server.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated server.js with CRUD routes and docs route.")
