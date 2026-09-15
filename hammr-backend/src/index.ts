import express from 'express';
import cors from 'cors';
import http from 'http';

import { env } from './utils/env.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

const server = http.createServer(app);

app.use(
  cors({
    origin: env.frontendOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  }),
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

app.use('/auth', authRoutes);

server.listen(env.port, () => {
  console.log(
    `Hammr backend running on port ${env.port}`,
  );
});