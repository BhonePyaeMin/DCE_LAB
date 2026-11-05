// Vercel serverless entry point: every request is rewritten here (see vercel.json).
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB } from '../config/db.js';

let connecting = null;

export default async function handler(req, res) {
  try {
    // Reuse the connection across warm invocations; reconnect if it dropped.
    if (mongoose.connection.readyState !== 1) {
      connecting ||= connectDB().finally(() => {
        connecting = null;
      });
      await connecting;
    }
  } catch (err) {
    console.error('Database connection failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Database unavailable. Please try again shortly.' }));
    return;
  }
  return app(req, res);
}
