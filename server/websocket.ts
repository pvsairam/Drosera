/**
 * WebSocket Server
 * 
 * Provides <100ms real-time price updates to connected clients
 * Broadcasts incidents, chain status, and price changes
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { OraclePrice, Incident, ChainStatus } from '@shared/schema';

export interface WebSocketMessage {
  type: 'price_update' | 'incident' | 'chain_status' | 'ping';
  data?: any;
  timestamp: number;
}

export class RealtimeServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;

  public initialize(httpServer: Server) {
    this.wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 WebSocket client connected');
      this.clients.add(ws);

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message.toString());
          this.handleClientMessage(ws, parsed);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: 'ping',
        timestamp: Date.now()
      });
    });

    // Start heartbeat to keep connections alive
    this.pingInterval = setInterval(() => {
      this.broadcast({
        type: 'ping',
        timestamp: Date.now()
      });
    }, 30000); // Every 30 seconds

    console.log('✅ WebSocket server initialized on /ws');
  }

  private handleClientMessage(ws: WebSocket, message: any) {
    // Handle client subscriptions if needed
    if (message.type === 'subscribe') {
      // Future: implement selective subscriptions
    }
  }

  private sendToClient(client: WebSocket, message: WebSocketMessage) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  public broadcast(message: WebSocketMessage) {
    const payload = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        sentCount++;
      }
    });

    if (sentCount > 0 && message.type !== 'ping') {
      console.log(`📡 Broadcast ${message.type} to ${sentCount} client(s)`);
    }
  }

  public broadcastPriceUpdate(price: OraclePrice) {
    this.broadcast({
      type: 'price_update',
      data: price,
      timestamp: Date.now()
    });
  }

  public broadcastIncident(incident: Incident) {
    this.broadcast({
      type: 'incident',
      data: incident,
      timestamp: Date.now()
    });
  }

  public broadcastChainStatus(status: ChainStatus) {
    this.broadcast({
      type: 'chain_status',
      data: status,
      timestamp: Date.now()
    });
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public shutdown() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.clients.forEach(client => {
      client.close();
    });

    if (this.wss) {
      this.wss.close();
    }

    console.log('WebSocket server shut down');
  }
}

// Singleton instance
export const realtimeServer = new RealtimeServer();
