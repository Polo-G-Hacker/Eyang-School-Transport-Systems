import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import { Server } from 'socket.io';
import { ZodError } from 'zod';
import { config } from './config.js';
import { authRouter } from './routes/auth.routes.js';
import { apiRouter } from './routes/api.routes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.set('io', io);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.json({ 
  name: 'ESTS Backend API', 
  status: 'running', 
  version: '1.0.0' 
}));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/api', apiRouter);

function friendlyValidationMessage(error) {
  const labels = {
    fullName: 'Full name',
    email: 'Email',
    password: 'Password',
    plateNumber: 'Plate number',
    color: 'Bus color',
    capacity: 'Capacity',
    pickupPointId: 'Pickup point',
    matricule: 'Matricule',
    levelLabel: 'Level',
    department: 'Department',
    monthKey: 'Month',
    studentId: 'Student'
  };
  const fields = [...new Set(error.errors.map(issue => labels[issue.path?.[0]] || issue.path?.[0]).filter(Boolean))];
  return fields.length ? `Please check: ${fields.join(', ')}.` : 'Please check the form and try again.';
}

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof ZodError) {
    return res.status(400).json({ message: friendlyValidationMessage(error), details: error.errors });
  }
  if (error.code === '23505') {
    return res.status(409).json({ message: 'This record already exists. Check the email, plate number, or monthly entry.' });
  }
  res.status(error.status || 500).json({ message: error.message || 'Internal server error' });
});

io.on('connection', socket => {
  socket.on('join:bus', busId => socket.join(`bus:${busId}`));
});

server.listen(config.port, () => {
  console.log(`ESTS backend listening on http://localhost:${config.port}`);
});
