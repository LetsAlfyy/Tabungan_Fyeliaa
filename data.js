// data.js - SIMPLE VERSION (PASTI JALAN)
let storage = {
  transactions: [],
  notes: "Selamat datang di Fyeliaa! 💰\nCatat semua transaksi keuangan Alfye & Aulia di sini."
};

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

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
    console.log('📱 API Request:', { method: req.method, type, id });

    // GET TRANSACTIONS
    if (req.method === 'GET' && type === 'transactions') {
      return res.status(200).json({
        success: true,
        data: storage.transactions
      });
    }

    // GET NOTES
    if (req.method === 'GET' && type === 'notes') {
      return res.status(200).json({
        success: true,
        data: storage.notes
      });
    }

    // ADD TRANSACTION
    if (req.method === 'POST' && type === 'transaction') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        body = req.body;
      }

      const transaction = {
        id: generateId(),
        tanggal: body.tanggal,
        tanggalAsli: body.tanggalAsli,
        nama: body.nama,
        jenis: body.jenis,
        nominal: parseInt(body.nominal),
        keterangan: body.keterangan || '',
        createdAt: new Date().toISOString()
      };

      if (!transaction.nama || !transaction.jenis || !transaction.nominal || !transaction.tanggal) {
        return res.status(400).json({
          success: false,
          message: 'Data tidak lengkap'
        });
      }

      storage.transactions.unshift(transaction);
      
      return res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaksi berhasil disimpan!'
      });
    }

    // SAVE NOTES
    if (req.method === 'POST' && type === 'notes') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        body = req.body;
      }

      storage.notes = body.notes || body;

      return res.status(200).json({
        success: true,
        message: 'Catatan berhasil disimpan!'
      });
    }

    // DELETE TRANSACTION
    if (req.method === 'DELETE' && type === 'transaction') {
      storage.transactions = storage.transactions.filter(t => t.id !== id);

      return res.status(200).json({
        success: true,
        message: 'Transaksi berhasil dihapus!'
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Method tidak didukung'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}
