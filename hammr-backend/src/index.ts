import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import { env } from './utils/env.js';

import authRoutes from './routes/auth.routes.js';
import listingRoutes from './routes/listing.routes.js';
import bidRoutes from './routes/bid.routes.js';

import { registerAuctionSocket } from './sockets/auction.socket.js';

const app = express();

const server = http.createServer(app);

/*
 * ==========================================
 * Socket.IO
 * ==========================================
 */

const io = new Server(server, {
  cors: {
    origin: env.frontendOrigin,
    methods: ['GET', 'POST'],
  },
});

/*
 * ==========================================
 * Socket.IO Authentication
 * ==========================================
 *
 * Frontend connects using:
 *
 * io(backendUrl, {
 *   auth: {
 *     token: accessToken
 *   }
 * })
 */

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== 'string') {
      return next(
        new Error('Authentication required'),
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!,
    ) as {
      id: string;
      role: 'BUYER' | 'SELLER' | 'ADMIN';
    };

    /*
     * Attach authenticated user to socket.
     */
    (
      socket as typeof socket & {
        user: {
          id: string;
          role: 'BUYER' | 'SELLER' | 'ADMIN';
        };
      }
    ).user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch {
    next(
      new Error('Invalid authentication token'),
    );
  }
});

/*
 * Make Socket.IO available to controllers.
 *
 * bid.controller.ts uses:
 *
 * req.app.get('io')
 */
app.set('io', io);

/*
 * ==========================================
 * Express Middleware
 * ==========================================
 */

app.use(
  cors({
    origin: env.frontendOrigin,
    methods: [
      'GET',
      'POST',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  }),
);

app.use(express.json());

/*
 * ==========================================
 * Health Check
 * ==========================================
 */

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

/*
 * ==========================================
 * API Routes
 * ==========================================
 */

/*
 * Authentication
 *
 * /auth/...
 */
app.use('/auth', authRoutes);

/*
 * Listings
 *
 * /listings/...
 */
app.use(listingRoutes);

/*
 * Bids
 *
 * GET  /listings/:id/bids
 * POST /listings/:id/bids
 */
app.use(bidRoutes);

/*
 * ==========================================
 * Auction Socket Events
 * ==========================================
 *
 * This registers:
 *
 * - user:<userId>
 * - auction:join
 * - auction:leave
 */
registerAuctionSocket(io);

/*
 * ==========================================
 * Start Server
 * ==========================================
 */

server.listen(env.port, () => {
  console.log(
    `Hammr backend running on port ${env.port}`,
  );
});