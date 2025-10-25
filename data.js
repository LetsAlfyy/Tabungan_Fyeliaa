// data.js - Backend API dengan MongoDB
import { MongoClient } from 'mongodb';

// MongoDB connection - GANTI dengan connection string kamu
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://fyeliaa_user:password123@cluster0.abc123.mongodb.net/fyeliaa?retryWrites=true&w=majority";
const DB_NAME = 'fyeliaa';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  console.log('🔗 Connecting to MongoDB...');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  console.log('✅ Connected to MongoDB');
  return { client, db };
}

// Helper function untuk generate ID
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, id } = req.query;

  try {
    console.log('📱 API Request:', { method: req.method, type, id });

    const { db } = await connectToDatabase();

    // GET: Ambil data transactions
    if (req.method === 'GET' && type === 'transactions') {
      const transactions = await db.collection('transactions')
        .find({})
        .sort({ tanggalAsli: -1 })
        .toArray();
      
      console.log('📊 Transactions from DB:', transactions.length);
      
      return res.status(200).json({
        success: true,
        data: transactions
      });
    }

    // GET: Ambil notes
    if (req.method === 'GET' && type === 'notes') {
      const notesDoc = await db.collection('settings').findOne({ key: 'notes' });
      const notes = notesDoc ? notesDoc.value : "Selamat datang di Fyeliaa! 💰\nCatat semua transaksi keuangan Alfye & Aulia di sini.";
      
      return res.status(200).json({
        success: true,
        data: notes
      });
    }

    // POST: Tambah transaction baru
    if (req.method === 'POST' && type === 'transaction') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        body = req.body;
      }

      console.log('💾 POST Body:', body);

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
      
      // Simpan ke MongoDB
      await db.collection('transactions').insertOne(transaction);
      
      console.log('✅ Transaction saved to DB:', transaction);
      
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
      
      if (notesData === undefined || notesData === null) {
        return res.status(400).json({
          success: false,
          message: 'Data catatan tidak valid'
        });
      }
      
      // Update atau insert notes
      await db.collection('settings').updateOne(
        { key: 'notes' },
        { $set: { value: notesData } },
        { upsert: true }
      );
      
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
      
      const result = await db.collection('transactions').deleteOne({ id: id });
      
      if (result.deletedCount === 0) {
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
    console.error('❌ MongoDB Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
}
