import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';

interface WSClient {
  ws: WebSocket;
  assignmentId?: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WSClient> = new Map();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = Math.random().toString(36).substring(2);
      this.clients.set(clientId, { ws });

      console.log(`📡 WebSocket client connected: ${clientId}`);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'subscribe' && message.assignmentId) {
            const client = this.clients.get(clientId);
            if (client) {
              client.assignmentId = message.assignmentId;
              console.log(`📡 Client ${clientId} subscribed to assignment ${message.assignmentId}`);
            }
          }
        } catch {
          // ignore parse errors
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`📡 WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (err) => {
        console.error(`WebSocket error for ${clientId}:`, err);
        this.clients.delete(clientId);
      });

      ws.send(JSON.stringify({ type: 'connected', clientId }));
    });
  }

  notifyAssignment(assignmentId: string, payload: Record<string, unknown>): void {
    this.clients.forEach((client) => {
      if (
        client.assignmentId === assignmentId &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(JSON.stringify({ ...payload, assignmentId }));
      }
    });
  }

  broadcast(payload: Record<string, unknown>): void {
    this.clients.forEach(({ ws }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    });
  }
}

export const wsService = new WebSocketService();
