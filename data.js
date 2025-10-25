// data.js - MONGODB VERSION (PERMANEN)
import { MongoClient } from 'mongodb';

// GANTI DENGAN CONNECTION STRING ANDA
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://fyeliaa_user:Fyeliaa123@cluster0.abc123.mongodb.net/fyeliaa?retryWrites=true&w=majority";

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  console.log('🔄 Connecting to MongoDB...');
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    cachedDb = db;
    
    console.log('✅ MongoDB Connected Successfully!');
    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    throw error;
  }
}

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

    const db = await connectToDatabase();

    // GET TRANSACTIONS
    if (req.method === 'GET' && type === 'transactions') {
      try {
        const transactions = await db.collection('transactions')
          .find({})
          .sort({ tanggalAsli: -1 })
          .toArray();
        
        console.log(`📊 Found ${transactions.length} transactions from MongoDB`);
        
        return res.status(200).json({
          success: true,
          data: transactions
        });
      } catch (error) {
        console.error('❌ Get transactions error:', error);
        return res.status(200).json({
          success: true,
          data: []
        });
      }
    }

    // GET NOTES
    if (req.method === 'GET' && type === 'notes') {
      try {
        const notesDoc = await db.collection('settings').findOne({ key: 'notes' });
        const notes = notesDoc ? notesDoc.value : "Selamat datang di Fyeliaa! 💰\nCatat semua transaksi keuangan Alfye & Aulia di sini.";
        
        return res.status(200).json({
          success: true,
          data: notes
        });
      } catch (error) {
        return res.status(200).json({
          success: true,
          data: "Selamat datang di Fyeliaa! 💰"
        });
      }
    }

    // ADD TRANSACTION
    if (req.method === 'POST' && type === 'transaction') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        body = req.body;
      }

      console.log('💾 Saving transaction to MongoDB:', body);

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
          message: 'Data tidak lengkap!'
        });
      }

      try {
        await db.collection('transactions').insertOne(transaction);
        
        console.log('✅ Transaction saved to MongoDB! ID:', transaction.id);
        
        return res.status(201).json({
          success: true,
          data: transaction,
          message: 'Transaksi berhasil disimpan! 🎉'
        });
      } catch (error) {
        console.error('❌ Save to MongoDB failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Gagal menyimpan ke database'
        });
      }
    }

    // SAVE NOTES
    if (req.method === 'POST' && type === 'notes') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        body = req.body;
      }

      const notesData = body.notes || body;

      try {
        await db.collection('settings').updateOne(
          { key: 'notes' },
          { $set: { value: notesData } },
          { upsert: true }
        );

        console.log('📝 Notes saved to MongoDB');

        return res.status(200).json({
          success: true,
          message: 'Catatan berhasil disimpan! 📝'
        });
      } catch (error) {
        console.error('❌ Save notes failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Gagal menyimpan catatan'
        });
      }
    }

    // DELETE TRANSACTION
    if (req.method === 'DELETE' && type === 'transaction') {
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID transaksi diperlukan!'
        });
      }

      try {
        const result = await db.collection('transactions').deleteOne({ id: id });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({
            success: false,
            message: 'Transaksi tidak ditemukan!'
          });
        }

        console.log('🗑️ Transaction deleted from MongoDB:', id);

        return res.status(200).json({
          success: true,
          message: 'Transaksi berhasil dihapus! 🗑️'
        });
      } catch (error) {
        console.error('❌ Delete transaction failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Gagal menghapus transaksi'
        });
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method tidak didukung!'
    });

  } catch (error) {
    console.error('❌ MongoDB Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error: ' + error.message
    });
  }
}
