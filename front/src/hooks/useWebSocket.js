import { useEffect, useRef, useState, useCallback } from 'react';
import Cookies from 'js-cookie';

/**
 * Hook React pour le chat WebSocket en temps réel.
 *
 * @param {string|null} ticketId  — L'ID du ticket (UUID). `null` = pas de connexion.
 * @returns {{ messages, sendMessage, isConnected }}
 */
export function useWebSocket(ticketId) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const retryCount = useRef(0);
  const seenIds = useRef(new Set()); // Anti-doublon robuste
  const MAX_RETRIES = 5;

  const getToken = useCallback(() => {
    return Cookies.get('access') || null;
  }, []);

  const connect = useCallback(() => {
    if (!ticketId) return;
    const token = getToken();
    if (!token) {
      console.warn('[WS] Pas de token JWT — impossible de se connecter');
      return;
    }

    // Fermer toute connexion précédente
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const wsHost = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000';
    const wsUrl = `${wsHost}/ws/chat/${ticketId}/?token=${token}`;

    console.log('[WS] Connexion à', wsUrl.replace(/token=.*/, 'token=***'));
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[WS] ✅ Connecté au ticket', ticketId);
      setIsConnected(true);
      retryCount.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'message' && data.message_id) {
          // Anti-doublon : ignorer si on a déjà vu cet ID
          if (seenIds.current.has(data.message_id)) return;
          seenIds.current.add(data.message_id);

          const newMsg = {
            id: data.message_id,
            contenu: data.contenu,
            expediteur_id: data.expediteur_id,
            expediteur_nom: data.expediteur_nom,
            expediteur_prenom: data.expediteur_prenom,
            expediteur_role: data.expediteur_type,
            date_envoi: data.created_at,
          };
          setMessages(prev => [...prev, newMsg]);
        }
      } catch (err) {
        console.error('[WS] Erreur parsing message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('[WS] ❌ Déconnecté (code:', event.code, ')');
      setIsConnected(false);

      // Ne pas reconnecter si on a fermé volontairement
      if (wsRef.current !== ws) return;
      wsRef.current = null;

      // Reconnexion automatique avec backoff exponentiel
      if (retryCount.current < MAX_RETRIES && ticketId) {
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 10000);
        console.log(`[WS] Reconnexion dans ${delay / 1000}s... (tentative ${retryCount.current + 1}/${MAX_RETRIES})`);
        reconnectTimer.current = setTimeout(() => {
          retryCount.current++;
          connect();
        }, delay);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Erreur WebSocket:', err);
    };

    wsRef.current = ws;
  }, [ticketId, getToken]);

  // Envoyer un message via WebSocket
  const sendMessage = useCallback((contenu) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ contenu }));
      return true;
    }
    console.warn('[WS] Impossible d\'envoyer — WebSocket non connecté');
    return false;
  }, []);

  // Connexion / déconnexion quand le ticketId change
  useEffect(() => {
    // Reset
    setMessages([]);
    seenIds.current = new Set();

    connect();

    return () => {
      // Cleanup
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null; // marque comme fermé volontairement
        ws.close();
      }
      setIsConnected(false);
    };
  }, [ticketId, connect]);

  return { messages, sendMessage, isConnected, setMessages };
}
