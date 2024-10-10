import {
  Injectable,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ChatService {
  private clients: { [sessionName: string]: Client } = {};
  private qrSent = false;
  private sessionsDir = path.join(__dirname, '..', '..', 'sessions');

  constructor() {
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir);
    }
    this.loadExistingSessions();
  }

  async startSession(sessionName: string, res: any): Promise<string> {
    if (!sessionName) {
      throw new BadRequestException('Session name is required.');
    }

    if (this.clients[sessionName]) {
      throw new ConflictException(`Session ${sessionName} already exists.`);
    }

    // Crea el cliente de WhatsApp
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: sessionName }), // Asigna un ID único por sesión
      puppeteer: {
        headless: false,
      },
    });

    this.clients[sessionName] = client; // Almacena el cliente en el objeto

    // Maneja el evento de generación del código QR
    client.on('qr', async (qr) => {
      if (!this.qrSent) {
        console.log('QR code received');
        try {
          const qrCodeBuffer = await qrcode.toBuffer(qr, {
            type: 'png',
            width: 100,
            errorCorrectionLevel: 'M',
          });

          fs.writeFileSync(
            path.join(this.sessionsDir, `${sessionName}.png`),
            qrCodeBuffer,
          );

          res.setHeader('Content-Type', 'image/png');
          res.send(qrCodeBuffer);
          this.qrSent = true;
        } catch (err) {
          console.error('Error generating QR code:', err);
          throw new HttpException(
            'Error generating QR code.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        console.log('QR code already sent, waiting for scan...');
      }
    });

    // Inicializa el cliente
    await client.initialize();

    return `Account ${sessionName} initialized, please wait for QR code.`;
  }

  async sendMessage(
    sessionName: string,
    phoneNumber: string,
    message: string,
  ): Promise<void> {
    const client = this.clients[sessionName]; // Accede al cliente usando sessionName

    if (!client) {
      throw new HttpException(
        'Client is not initialized. Please start a session.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const formattedNumber = `${phoneNumber}@c.us`;
      await client.sendMessage(formattedNumber, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw new HttpException(
        'Failed to send message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  getActiveSessionsCount(): number {
    return Object.keys(this.clients).length; // Retorna el número de sesiones activas
  }
  async restartSession(sessionName: string, res: any): Promise<string | void> {
    // Si el cliente ya existe, destruirlo
    if (this.clients[sessionName]) {
      await this.clients[sessionName].destroy(); // Destruye la sesión actual
      delete this.clients[sessionName]; // Elimina la instancia del cliente
      this.qrSent = false; // Reinicia el estado del QR
    }

    // Inicia una nueva sesión
    return this.startSession(sessionName, res);
  }

  private loadExistingSessions() {
    const sessionFiles = fs.readdirSync(this.sessionsDir);

    sessionFiles.forEach((file) => {
      const sessionName = path.parse(file).name; // Obtiene el nombre sin la extensión
      // Puedes agregar lógica para inicializar cada cliente según tus necesidades
      this.clients[sessionName] = new Client({
        authStrategy: new LocalAuth({
          clientId: sessionName, // Aquí puedes usar el nombre de sesión como clientId
        }),
        puppeteer: {
          headless: false, // Cambia a true si no quieres ver el navegador
        },
      });

      // Maneja la inicialización de cada cliente
      this.clients[sessionName]
        .initialize()
        .then(() => {
          console.log(`Session ${sessionName} loaded and initialized.`);
        })
        .catch((err) => {
          console.error(`Error initializing session ${sessionName}:`, err);
        });
    });
  }
  getActiveSessions(): string[] {
    return Object.keys(this.clients); // Devuelve un array con los nombres de las sesiones activas
  }
}
