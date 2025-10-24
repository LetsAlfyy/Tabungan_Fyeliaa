// api/data.js
const { v4: uuidv4 } = require('uuid');

// Simpan data di memory (untuk demo, di production gunakan database)
let storage = {
  transactions: [],
  notes: ''
};

export default async function handler(req, res) {
  // Set CORS headers untuk mengizinkan akses dari domain mana saja
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, type, id } = req.query;

  try {
    // GET: Ambil semua data
    if (req.method === 'GET') {
      if (type === 'transactions') {
        return res.status(200).json({
          success: true,
          data: storage.transactions
        });
      } else if (type === 'notes') {
        return res.status(200).json({
          success: true,
          data: storage.notes
        });
      } else {
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
      if (type === 'transaction') {
        const transaction = {
          id: uuidv4(),
          ...req.body,
          createdAt: new Date().toISOString()
        };
        
        storage.transactions.push(transaction);
        
        return res.status(201).json({
          success: true,
          data: transaction,
          message: 'Transaksi berhasil ditambahkan'
        });
      } else if (type === 'notes') {
        storage.notes = req.body.notes;
        
        return res.status(200).json({
          success: true,
          message: 'Catatan berhasil disimpan'
        });
      }
    }

    // DELETE: Hapus data
    if (req.method === 'DELETE' && type === 'transaction') {
      storage.transactions = storage.transactions.filter(t => t.id !== id);
      
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
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
}
