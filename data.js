// data.js - MONGODB dengan ERROR HANDLING
import { MongoClient } from 'mongodb';

// GANTI DENGAN CONNECTION STRING ANDA
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://fyeliaa_user:Fyeliaa123@cluster0.abc123.mongodb.net/fyeliaa?retryWrites=true&w=majority";

let cachedDb = null;
let connectionError = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  if (connectionError) {
    throw connectionError;
  }

  console.log('🔄 Connecting to MongoDB...');
  
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    
    await client.connect();
    const db = client.db();
    cachedDb = db;
    
    console.log('✅ MongoDB Connected Successfully!');
    return db;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    connectionError = error;
    throw error;
  }
}

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Fallback data jika MongoDB down
const fallbackData = {
  transactions: [],
  notes: "Selamat datang di Fyeliaa! 💰\nCatat semua transaksi keuangan Alfye & Aulia di sini."
};

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

    // GET TRANSACTIONS - dengan fallback
    if (req.method === 'GET' && type === 'transactions') {
      try {
        const db = await connectToDatabase();
        const transactions = await db.collection('transactions')
          .find({})
          .sort({ tanggalAsli: -1 })
          .toArray();
        
        console.log(`📊 Found ${transactions.length} transactions from MongoDB`);
        
        return res.status(200).json({
          success: true,
          data: transactions,
          source: 'mongodb'
        });
      } catch (error) {
        console.log('⚠️ Using fallback data for transactions');
        return res.status(200).json({
          success: true,
          data: fallbackData.transactions,
          source: 'fallback'
        });
      }
    }

    // GET NOTES - dengan fallback
    if (req.method === 'GET' && type === 'notes') {
      try {
        const db = await connectToDatabase();
        const notesDoc = await db.collection('settings').findOne({ key: 'notes' });
        const notes = notesDoc ? notesDoc.value : fallbackData.notes;
        
        return res.status(200).json({
          success: true,
          data: notes,
          source: 'mongodb'
        });
      } catch (error) {
        console.log('⚠️ Using fallback data for notes');
        return res.status(200).json({
          success: true,
          data: fallbackData.notes,
          source: 'fallback'
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

      console.log('💾 Saving transaction:', body);

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
        const db = await connectToDatabase();
        await db.collection('transactions').insertOne(transaction);
        
        console.log('✅ Transaction saved to MongoDB! ID:', transaction.id);
        
        // Juga simpan ke fallback
        fallbackData.transactions.unshift(transaction);
        
        return res.status(201).json({
          success: true,
          data: transaction,
          message: 'Transaksi berhasil disimpan! 🎉',
          source: 'mongodb'
        });
      } catch (error) {
        console.error('❌ MongoDB save failed, using fallback');
        
        // Simpan ke fallback data
        fallbackData.transactions.unshift(transaction);
        
        return res.status(201).json({
          success: true,
          data: transaction,
          message: 'Transaksi disimpan (offline mode) 📱',
          source: 'fallback'
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
        const db = await connectToDatabase();
        await db.collection('settings').updateOne(
          { key: 'notes' },
          { $set: { value: notesData } },
          { upsert: true }
        );

        console.log('📝 Notes saved to MongoDB');
        
        // Juga simpan ke fallback
        fallbackData.notes = notesData;

        return res.status(200).json({
          success: true,
          message: 'Catatan berhasil disimpan! 📝',
          source: 'mongodb'
        });
      } catch (error) {
        console.error('❌ MongoDB notes save failed, using fallback');
        
        // Simpan ke fallback
        fallbackData.notes = notesData;

        return res.status(200).json({
          success: true,
          message: 'Catatan disimpan (offline mode) 📱',
          source: 'fallback'
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
        const db = await connectToDatabase();
        const result = await db.collection('transactions').deleteOne({ id: id });
        
        if (result.deletedCount === 0) {
          // Coba hapus dari fallback juga
          fallbackData.transactions = fallbackData.transactions.filter(t => t.id !== id);
          
          return res.status(404).json({
            success: false,
            message: 'Transaksi tidak ditemukan!'
          });
        }

        console.log('🗑️ Transaction deleted from MongoDB:', id);
        
        // Juga hapus dari fallback
        fallbackData.transactions = fallbackData.transactions.filter(t => t.id !== id);

        return res.status(200).json({
          success: true,
          message: 'Transaksi berhasil dihapus! 🗑️',
          source: 'mongodb'
        });
      } catch (error) {
        console.error('❌ MongoDB delete failed, using fallback');
        
        // Hapus dari fallback
        const initialLength = fallbackData.transactions.length;
        fallbackData.transactions = fallbackData.transactions.filter(t => t.id !== id);
        
        if (fallbackData.transactions.length === initialLength) {
          return res.status(404).json({
            success: false,
            message: 'Transaksi tidak ditemukan!'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Transaksi dihapus (offline mode) 📱',
          source: 'fallback'
        });
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method tidak didukung!'
    });

  } catch (error) {
    console.error('❌ Server Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
}
