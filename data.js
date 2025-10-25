// data.js - GOOGLE SHEETS VERSION
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzbkvEBnYpoM_yFtNgFcTlLaFiRk7UAsI2Qsy3DLZMEfPx2pr_Q0qVjM4jvwvihKRDkw/exec'; // GANTI DENGAN URL DEPLOY ANDA

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

    // Build URL for Google Apps Script
    let url = `${GOOGLE_SCRIPT_URL}?type=${type}`;
    if (id) url += `&id=${encodeURIComponent(id)}`;

    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Add body for POST requests
    if (req.method === 'POST') {
      options.body = JSON.stringify(req.body);
    }

    console.log('🔗 Calling Google Script:', url);
    
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log('✅ Google Sheets response:', result);
    
    res.status(response.status).json(result);
    
  } catch (error) {
    console.error('❌ Google Sheets error:', error);
    
    // Fallback responses
    if (req.method === 'GET' && type === 'transactions') {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    if (req.method === 'GET' && type === 'notes') {
      return res.status(200).json({
        success: true,
        data: "Selamat datang di Fyeliaa! 💰"
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Koneksi ke Google Sheets gagal: ' + error.message
    });
  }
}
