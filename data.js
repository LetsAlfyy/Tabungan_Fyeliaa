// data.js - SIMPLE VERSION (Memory Storage)
let storage = {
  transactions: [],
  notes: "Selamat datang di Fyeliaa! 💰"
};

function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, id } = req.query;

  try {
    console.log('📱 API Request:', { method: req.method, type, id });

    // GET: Ambil transactions
    if (req.method === 'GET' && type === 'transactions') {
      return res.status(200).json({
        success: true,
        data: storage.transactions
      });
    }

    // GET: Ambil notes
    if (req.method === 'GET' && type === 'notes') {
      return res.status(200).json({
        success: true,
        data: storage.notes
      });
    }

    // POST: Tambah transaction
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
      
      // Validasi
      if (!transaction.nama || !transaction.jenis || !transaction.nominal || !transaction.tanggal) {
        return res.status(400).json({
          success: false,
          message: 'Data transaksi tidak lengkap'
        });
      }
      
      // Simpan ke memory
      storage.transactions.unshift(transaction);
      
      console.log('✅ Transaction saved:', transaction);
      
      return res.status(201).json({
        success: true,
        data: transaction,
        message: 'Transaksi berhasil ditambahkan'
      });
    }

    // POST: Simpan notes
    if (req.method === 'POST' && type === 'notes') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        body = req.body;
      }

      const notesData = body.notes || body;
      storage.notes = notesData;
      
      return res.status(200).json({
        success: true,
        message: 'Catatan berhasil disimpan'
      });
    }

    // DELETE: Hapus transaction
    if (req.method === 'DELETE' && type === 'transaction') {
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID transaksi diperlukan'
        });
      }
      
      const initialLength = storage.transactions.length;
      storage.transactions = storage.transactions.filter(t => t.id !== id);
      
      if (storage.transactions.length === initialLength) {
        return res.status(404).json({
          success: false,
          message: 'Transaksi tidak ditemukan'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Transaksi berhasil dihapus'
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Method tidak diizinkan'
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}
