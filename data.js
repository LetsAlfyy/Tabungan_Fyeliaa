// data.js - SIMPLE VERSION DULU
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyj4LlPQDxR0omsQwPFc8kYKRBm87d60JknIMaMeS981jG1mM4MgVy2jlT2cPW2IQIN/exec'; // GANTI DENGAN URL ANDA

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
    console.log('📱 Request:', { method: req.method, type, id });

    // Test URL Google Script
    let url = `${GOOGLE_SCRIPT_URL}?type=${type}`;
    if (id) url += `&id=${id}`;

    console.log('🔗 Calling:', url);

    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
    });

    const result = await response.json();
    console.log('✅ Response:', result);
    
    res.status(response.status).json(result);
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    // FALLBACK: Return empty data jika error
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
      message: 'Koneksi gagal: ' + error.message
    });
  }
}
