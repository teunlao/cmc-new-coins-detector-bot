import http from 'http';
import { Server } from 'socket.io';

export default class WsService {
  constructor() {
    this.server = http.createServer();
    this.io = new Server(this.server, {});

    this.io.on('connection', (socket) => {
      console.log('socket connection');
    });

    this.server.listen(process.env.PORT || 3000, () => {
      console.log('HTTP Server started');
    });
  }

  emitAlert({ module, contract }) {
    this.io.sockets.emit('newContract', { module, contract });
  }
}
