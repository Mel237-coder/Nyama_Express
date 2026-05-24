import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PORT } from './config/constants';
import { errorHandler } from './middleware/errorHandler';
import { registerOrderHandlers } from './sockets/orderSocket';
import { registerDriverHandlers, setSocketServer } from './sockets/driverSocket';
import { startOrderTimeoutWorker } from './workers/orderTimeoutWorker';
import { OrderService } from './services/orderService';
import { PaymentService } from './services/paymentService';
import { NotificationService } from './services/notificationService';
import { TimeoutService } from './services/timeoutService';
import { DriverMatchingService } from './services/driverMatchingService';
import { RoutingService } from './services/routingService';
import { apiRouter } from './routes';
import { getSupabaseClient, getSupabaseAdmin } from './config/supabase';
import { getRedis } from './config/redis';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Store Socket.IO server instance for targeted emissions (e.g. delivery requests)
setSocketServer(io);

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  if (!token) {
    return next(new Error('Authentication error: token required'));
  }
  try {
    const supabase = getSupabaseClient(token);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return next(new Error('Authentication error: invalid token'));
    }
    socket.data.userId = user.id;
    socket.data.userRole = user.user_metadata?.role || 'client';
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

// Dependency wiring
const paymentService = new PaymentService();
const notificationService = new NotificationService();
const timeoutService = new TimeoutService();
const driverMatchingService = new DriverMatchingService();
const routingService = new RoutingService();

const orderService = new OrderService(
  paymentService,
  notificationService,
  timeoutService,
  driverMatchingService,
  routingService,
  io,
);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (_req, res) => {
  const checks: Record<string, 'ok' | 'fail'> = {};

  // Supabase
  try {
    const { error } = await getSupabaseAdmin().from('profiles').select('id').limit(1);
    checks.supabase = error ? 'fail' : 'ok';
  } catch {
    checks.supabase = 'fail';
  }

  // Redis
  try {
    await getRedis().ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'fail';
  }

  const overall = Object.values(checks).every((v) => v === 'ok') ? 'ok' : 'degraded';
  res.status(overall === 'ok' ? 200 : 503).json({ status: overall, service: 'djossfood-api', checks });
});

// Routes
app.use('/api', apiRouter);

// Error handler
app.use(errorHandler);

// Socket.IO
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  registerOrderHandlers(io, socket);
  registerDriverHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
  });
});

// Workers
startOrderTimeoutWorker(orderService);

// Start
httpServer.listen(PORT, () => {
  console.log(`[API] DjossFood API running on port ${PORT}`);
  console.log(`[API] Socket.IO ready`);
});

export { app, io };