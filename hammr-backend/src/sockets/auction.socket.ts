import type { Server, Socket } from 'socket.io';

interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
  };
}

export function registerAuctionSocket(io: Server) {
  io.on('connection', (socket) => {
    const authenticatedSocket = socket as AuthenticatedSocket;

    const userId = authenticatedSocket.user.id;

    /*
     * Private user room.
     *
     * Used for:
     * - bid:outbid
     * - future winning notifications
     * - future payment notifications
     */
    socket.join(`user:${userId}`);

    /*
     * Join auction room.
     */
    socket.on('auction:join', (listingId: string) => {
      if (typeof listingId !== 'string' || !listingId) {
        return;
      }

      socket.join(`auction:${listingId}`);
    });

    /*
     * Leave auction room.
     */
    socket.on('auction:leave', (listingId: string) => {
      if (typeof listingId !== 'string' || !listingId) {
        return;
      }

      socket.leave(`auction:${listingId}`);
    });

    /*
     * Cleanup is automatically handled by Socket.IO
     * when the connection disconnects.
     */
  });
}
