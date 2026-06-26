import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './server/routes/auth.js';
import patientRoutes from './server/routes/patient.js';
import doctorRoutes from './server/routes/doctor.js';
import chatRoutes from './server/routes/chat.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_chat', (appointmentId) => {
      socket.join(appointmentId);
      console.log(`User joined chat: ${appointmentId}`);
    });

    socket.on('send_message', (data) => {
      io.to(data.appointmentId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  let MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.log('No MONGODB_URI found. Starting MongoDB Memory Server for preview...');
    try {
      const mongoServer = await MongoMemoryServer.create();
      MONGODB_URI = mongoServer.getUri();
      console.log('MongoDB Memory Server started at:', MONGODB_URI);
    } catch (err) {
      console.error('Failed to start MongoDB Memory Server:', err);
    }
  }

  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, 
      });
      console.log('MongoDB Connected Successfully');
    } catch (err) {
      console.error('MongoDB Connection Error:', err);
    }
  } else {
    console.error('No MongoDB connection available. Operations will fail.');
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/patient', patientRoutes);
  app.use('/api/doctor', doctorRoutes);
  app.use('/api/chat', chatRoutes);

  app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
      status: 'ok', 
      database: dbStatus,
      message: dbStatus === 'connected' ? 'Healthcare System is fully operational' : 'Database connection pending or failed'
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
