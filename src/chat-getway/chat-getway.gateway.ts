import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';
import qrcode from 'qrcode';

@WebSocketGateway({ path: '/qr_real' })
@Injectable()
export class ChatGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  sendQrCode(qr: string) {
    qrcode
      .toDataURL(qr)
      .then((qrImage) => {
        this.server.emit('qrCode', qrImage); // Envía el QR a todos los clientes conectados
      })
      .catch((error) => {
        console.error('Error generating QR code:', error);
      });
  }
}
