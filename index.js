import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inisialisasi Express
const app = express();
const PORT = process.env.PORT || 3000;

// Inisialisasi Google Gen AI SDK dengan API Key dari .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ============================================================
// Endpoint POST /api/chat
// Menerima pesan dari frontend dan meneruskannya ke Gemini API
// ============================================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    // Susun riwayat percakapan (history) untuk konteks multi-turn
    const contents = [];

    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role,       // 'user' atau 'model'
          parts: [{ text: turn.text }],
        });
      }
    }

    // Tambahkan pesan terbaru dari user
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Kirim ke Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    const replyText = response.text;

    res.json({ reply: replyText });
  } catch (error) {
    console.error('Error saat menghubungi Gemini API:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server. Silakan coba lagi.' });
  }
});

// Fallback: Semua route lain mengembalikan index.html (untuk SPA)
// Catatan: '/{*path}' adalah sintaks wildcard yang kompatibel dengan Express v5
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});