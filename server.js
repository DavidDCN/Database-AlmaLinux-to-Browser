require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());          // replaces body-parser in Express 5
app.use(express.static('public'));

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});

// Proves which database server you're talking to
app.get('/api/health', async (req, res) => {
    try {
        const r = await pool.query(
            'SELECT inet_server_addr() AS db_server_ip, current_database() AS db, version() AS version'
        );
        res.json({ status: 'ok', ...r.rows[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

app.post('/api/messages', async (req, res) => {
    const message = (req.body.message || '').trim();
    if (!message || message.length > 500) {
        return res.status(400).json({ success: false, error: 'Message must be 1-500 characters' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO messages (content) VALUES ($1) RETURNING *',
            [message]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM messages ORDER BY created_at DESC LIMIT 100'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));