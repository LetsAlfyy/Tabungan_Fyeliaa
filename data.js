// data.js - Backend API untuk Fyeliaa

// Simpan data di memory (untuk demo)
let storage = {
  transactions: [],
  notes: "Selamat datang di Fyeliaa! 💰\nCatat semua transaksi keuangan Alfye & Aulia di sini."
};

// Helper function untuk generate ID sederhana
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Fungsi utama handler API
export default async function handler(req, res) {
  // Set CORS headers lengkap untuk mobile
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight request untuk CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, id } = req.query;

  try {
    console.log('📱 API Request:', { 
      method: req.method, 
      type, 
      id,
      origin: req.headers.origin
    });

    // GET: Ambil data
    if (req.method === 'GET') {
      if (type === 'transactions') {
        console.log('📊 Mengirim transactions:', storage.transactions.length);
        return res.status(200).json({
          success: true,
          data: storage.transactions,
          count: storage.transactions.length
        });
      } else if (type === 'notes') {
        return res.status(200).json({
          success: true,
          data: storage.notes
        });
      } else {
        // Return semua data
        return res.status(200).json({
          success: true,
          data: {
            transactions: storage.transactions,
            notes: storage.notes
          }
        });
      }
    }

    // POST: Tambah data baru
    if (req.method === 'POST') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        body = req.body;
      }

      console.log('💾 POST Body:', body);

      if (type === 'transaction') {
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
        
        // Validasi data
        if (!transaction.nama || !transaction.jenis || !transaction.nominal || !transaction.tanggal) {
          return res.status(400).json({
            success: false,
            message: 'Data transaksi tidak lengkap'
          });
        }
        
        storage.transactions.push(transaction);
        
        console.log('✅ Transaction saved:', transaction);
        console.log('📈 Total transactions now:', storage.transactions.length);
        
        return res.status(201).json({
          success: true,
          data: transaction,
          message: 'Transaksi berhasil ditambahkan'
        });
      } 
      
      else if (type === 'notes') {
        const notesData = body.notes || body;
        
        if (notesData === undefined || notesData === null) {
          return res.status(400).json({
            success: false,
            message: 'Data catatan tidak valid'
          });
        }
        
        storage.notes = notesData;
        
        return res.status(200).json({
          success: true,
          message: 'Catatan berhasil disimpan'
        });
      }
    }

    // DELETE: Hapus transaksi
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

    // Method tidak didukung
    return res.status(405).json({
      success: false,
      message: 'Method tidak diizinkan'
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server: ' + error.message
    });
  }
}
