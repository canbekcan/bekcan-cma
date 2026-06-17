/**
 * File: backend/routes/conferences.js
 * Description: Public routes for retrieving conference schedules, details, and posting attendee registrations.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/conferences (Public List)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, slug, name, abbreviation, start_date, end_date, venue_info, logo_url FROM conferences ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('[Conferences API] Fetch list error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/conferences/:slug/schedule (Public Detailed Schedule)
router.get('/:slug/schedule', async (req, res) => {
  const { slug } = req.params;
  try {
    const confRes = await pool.query('SELECT * FROM conferences WHERE slug = $1', [slug]);
    if (confRes.rows.length === 0) {
      return res.status(404).json({ error: 'Conference not found' });
    }
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

    // Format dates and sessions (old layout mapping)
    const datesSet = new Set();
    const formattedSessions = sessionsRes.rows.map(s => {
      const s_speakers = relationsRes.rows.filter(r => r.session_id === s.id).map(r => r.speaker_ref);
      
      let startStr = '';
      if (s.start_time) {
        const startDate = new Date(s.start_time);
        if (!isNaN(startDate.getTime())) {
          startStr = startDate.toISOString().split('T')[0];
          datesSet.add(startStr);
        }
      }

      return {
        id: s.session_ref,
        start: s.start_time,
        end: s.end_time,
        title_tr: s.title_tr,
        title_en: s.title_en,
        description_tr: s.description_tr,
        description_en: s.description_en,
        room: s.room || '',
        category: s.category || '',
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
        abbreviation: conference.abbreviation,
        logo_url: conference.logo_url,
        dates: Array.from(datesSet).sort(),
        venue: { address: conference.venue_info },
        wifi: { ssid: conference.wifi_ssid, password: conference.wifi_wpa }
      },
      speakers: formattedSpeakers,
      sessions: formattedSessions
    });
  } catch (err) {
    console.error('[Conferences API] Fetch schedule error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/conferences/:slug/attendee (Attendee Registration)
router.post('/:slug/attendee', async (req, res) => {
  const { slug } = req.params;
  const { device_id, full_name, title, institution, email, phone } = req.body;
  if (!device_id || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const confRes = await pool.query('SELECT id FROM conferences WHERE slug = $1', [slug]);
    if (confRes.rows.length === 0) {
      return res.status(404).json({ error: 'Conference not found' });
    }
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
    console.error('[Conferences API] Attendee registration error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
