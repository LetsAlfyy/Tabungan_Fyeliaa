// data.js - GOOGLE SHEETS VERSION (PERMANEN)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/a/macros/webmail.uad.ac.id/s/AKfycbwkv87fg4Hb_QlbzAgDpha0HHoE__2pdN_7mYMkAAd0u0eiiGwv5vbig6b8cNDOEkP2Ng/exec'; // GANTI DENGAN URL DEPLOY ANDA

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, id } = req.query;

  try {
    console.log('📱 Forwarding to Google Sheets:', { method: req.method, type, id });

    // Build URL untuk Google Apps Script
    let url = `${GOOGLE_SCRIPT_URL}?type=${type}`;
    if (id) url += `&id=${encodeURIComponent(id)}`;

    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Tambah body untuk POST requests
    if (req.method === 'POST') {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log('✅ Google Sheets response:', { status: response.status, success: result.success });
    
    res.status(response.status).json(result);
    
  } catch (error) {
    console.error('❌ Google Sheets proxy error:', error);
    res.status(500).json({
      success: false,
      message: 'Koneksi ke database gagal: ' + error.message
    });
  }
}
