import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/contexts/AuthContext';
import { getMyTickets, getTicketDetail } from '@/api/tickets';
import { getMessages, sendMessage as sendMessageAPI } from '@/api/chat';
import { useWebSocket } from '@/hooks/useWebSocket';
import { NewTicketForm } from '@/components/features/portal/NewTicketForm';
import { CustomerTicketList } from '@/components/features/portal/CustomerTicketList';
import { CustomerChatDrawer } from '@/components/features/portal/CustomerChatDrawer';
import { Button } from '@/components/ui/button';
import './portal-view.css';

export default function PortalView() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('new');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const userPhone = user?.telephone || '';

  // Fetch tickets from API
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await getMyTickets();
      // data may be paginated: { results: [...], count, ... }
      setTickets(data.results || data);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // When a ticket is selected, fetch full details + chat messages
  const handleSelectTicket = async (ticket) => {
    try {
      // Fetch full ticket detail (includes type_service, description, pieces_jointes)
      const fullTicket = await getTicketDetail(ticket.id);
      setSelectedTicket(fullTicket);
    } catch (err) {
      console.error('Failed to fetch ticket detail:', err);
      setSelectedTicket(ticket); // Fallback to list data
    }

    try {
      const msgs = await getMessages(ticket.id);
      setChatMessages(msgs.results || msgs);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setChatMessages([]);
    }
  };

  // WebSocket temps réel pour le ticket sélectionné
  const { messages: wsMessages, sendMessage: wsSendMessage, isConnected } = useWebSocket(
    selectedTicket?.id || null
  );

  // Fusionner les messages HTTP (historique) + WS (temps réel)
  const allMessages = React.useMemo(() => {
    const httpIds = new Set(chatMessages.map(m => m.id));
    const newWsMessages = wsMessages.filter(m => !httpIds.has(m.id));
    return [...chatMessages, ...newWsMessages];
  }, [chatMessages, wsMessages]);

  const handleSendMessage = async (text) => {
    if (!selectedTicket) return;
    // Essayer d'envoyer via WebSocket d'abord (temps réel)
    if (isConnected && wsSendMessage(text)) {
      return; // Le message arrivera via onMessage du WebSocket
    }
    // Fallback HTTP si WS pas connecté
    try {
      const newMsg = await sendMessageAPI(selectedTicket.id, text);
      setChatMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleTicketCreated = () => {
    setActiveTab('history');
    fetchTickets();
  };

  return (
    <div className="portal-view-container">
      <div className="portal-header">
        <div className="portal-title-group">
          <h1 className="portal-main-title">{t('portal.title')}</h1>
          <p className="portal-subtitle">{t('login.tagline')}</p>
        </div>
        <div className="portal-tabs-nav">
          <Button
            variant={activeTab === 'new' ? 'default' : 'ghost'}
            className={`portal-tab-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            {t('portal.new_ticket')}
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            className={`portal-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            {t('portal.status')}
          </Button>
        </div>
      </div>

      <div className="portal-content-wrapper">
        {activeTab === 'new' ? (
          <NewTicketForm userPhone={userPhone} onSubmit={handleTicketCreated} />
        ) : (
          <CustomerTicketList
            tickets={tickets}
            loading={loading}
            onSelectTicket={handleSelectTicket}
            onTicketDeleted={() => fetchTickets()}
          />
        )}
      </div>

      <CustomerChatDrawer
        ticket={selectedTicket}
        messages={allMessages}
        onClose={() => { setSelectedTicket(null); setChatMessages([]); }}
        onSendMessage={handleSendMessage}
        onTicketDeleted={() => { setSelectedTicket(null); setChatMessages([]); fetchTickets(); }}
      />
    </div>
  );
}
