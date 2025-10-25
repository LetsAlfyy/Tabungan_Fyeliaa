// data.js - GOOGLE SHEETS VERSION (FIXED)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzzbkvEBnYpoM_yFtNgFcTlLaFiRk7UAsI2Qsy3DLZMEfPx2pr_Q0qVjM4jvwvihKRDkw/exec';

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

    console.log('🔗 Calling:', url);

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

    // Timeout after 10 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    options.signal = controller.signal;

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    const result = await response.json();
    
    console.log('✅ Google Sheets response:', { 
      status: response.status, 
      success: result.success,
      dataLength: result.data ? result.data.length : 0
    });
    
    res.status(response.status).json(result);
    
  } catch (error) {
    console.error('❌ Google Sheets error:', error.message);
    
    // Fallback responses untuk GET requests
    if (req.method === 'GET' && type === 'transactions') {
      console.log('🔄 Using fallback for transactions');
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    if (req.method === 'GET' && type === 'notes') {
      console.log('🔄 Using fallback for notes');
      return res.status(200).json({
        success: true,
        data: "Selamat datang di Fyeliaa! 💰\nCatat semua transaksi keuangan Alfye & Aulia di sini."
      });
    }
    
    // Untuk POST requests, return error yang jelas
    res.status(500).json({
      success: false,
      message: 'Gagal terhubung ke server. Coba lagi dalam beberapa saat.'
    });
  }
}
