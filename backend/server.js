import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';
import { sendPresenceEmail } from './services/emailService.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const frontendPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, './dist')
  : path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!req.body.user) {
      return res.status(400).json({ error: 'User data missing' });
    }

    const user = JSON.parse(req.body.user);

    if (!user.name || !user.email || !user.password || !user.week) {
      return res.status(400).json({ error: 'Invalid user data' });
    }

    const fileExt = req.file.mimetype === 'application/pdf' ? 'pdf' : 'jpg';
    const filename = `Attestation présence P2027- ${user.name} - Esisar- Semaine ${user.week}.${fileExt}`;

    const result = await sendPresenceEmail(
      user.email,
      user.password,
      filename,
      req.file.buffer,
      req.file.mimetype
    );

    if (result.success) {
      res.json({ success: true, message: 'Email sent successfully' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  const indexPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, './dist/index.html')
    : path.join(__dirname, '../frontend/dist/index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
