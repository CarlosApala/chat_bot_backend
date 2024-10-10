import { Controller, Post, Res, Body, Get } from '@nestjs/common';
import { ChatService } from './chat/chat.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly chatService: ChatService) {}

  @Post('start-session')
  async startSession(
    @Body('sessionName') sessionName: string,
    @Res() res: Response,
  ) {
    try {
      // Inicia la sesión y espera el QR
      const message = await this.chatService.startSession(sessionName, res);
      console.log('Session started:', message);
    } catch (error) {
      if (error.response) {
        // Manejo de error de respuesta
        return res.status(error.status).json({ error: error.response.message });
      }
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
  @Post('send-message')
  async sendMessage(
    @Body() body: { phoneNumber: string; message: string; sessionName: string }, // Agregamos sessionName
    @Res() res: Response,
  ) {
    const { phoneNumber, message, sessionName } = body;

    if (!sessionName) {
      return res.status(400).json({ error: 'Session name is required.' });
    }

    try {
      // Intenta enviar el mensaje
      const result = await this.chatService.sendMessage(
        sessionName,
        phoneNumber,
        message,
      );
      return res
        .status(200)
        .json({ message: 'Message sent successfully', result });
    } catch (error) {
      return res
        .status(error.status || 500)
        .json({ error: error.response?.message || 'Failed to send message.' });
    }
  }

  @Get('restart-session')
  async restartSession(
    @Body('sessionName') sessionName: string,
    @Res() res: Response,
  ) {
    try {
      const message = await this.chatService.restartSession(sessionName, res);
      console.log('Session restarted:', message);
    } catch (error) {
      if (error.response) {
        return res.status(error.status).json({ error: error.response.message });
      }
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  @Get('active-sessions/count')
  getActiveSessionsCount(): { count: number } {
    const count = this.chatService.getActiveSessionsCount();
    return { count }; // Retorna la cantidad de sesiones activas
  }

  @Get('active-sessions')
  getActiveSessions(): { sessions: string[] } {
    const sessions = this.chatService.getActiveSessions(); // Llama al método que devuelve las sesiones activas
    return { sessions }; // Retorna el array de nombres de sesiones
  }
}
