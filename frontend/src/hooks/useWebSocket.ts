import { useEffect, useRef, useCallback } from 'react';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { WSMessage } from '@/types';
import toast from 'react-hot-toast';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';

export function useWebSocket(assignmentId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setGenerationStatus, setWsConnected, setCurrentPaperId } = useAssignmentStore();

  const connect = useCallback(() => {
    if (!assignmentId) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        // Subscribe to the specific assignment
        ws.send(JSON.stringify({ type: 'subscribe', assignmentId }));
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);

          if (msg.type === 'connected') return;

          if (msg.assignmentId !== assignmentId && msg.assignmentId !== undefined) return;

          switch (msg.type) {
            case 'status_update':
              setGenerationStatus('processing', msg.message || 'Processing...');
              break;
            case 'completed':
              setGenerationStatus('completed', msg.message || 'Done!');
              if (msg.paperId) setCurrentPaperId(msg.paperId);
              toast.success('Question paper generated! 🎉');
              break;
            case 'failed':
              setGenerationStatus('failed', msg.message || 'Generation failed');
              toast.error(msg.message || 'Generation failed. Please try again.');
              break;
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket not available
    }
  }, [assignmentId, setGenerationStatus, setWsConnected, setCurrentPaperId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { disconnect };
}
