import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/contexts/AuthContext';
import { getAgentTickets, getAgentTicketDetail, updateTicketStatus, escalateTicket, getEscalatedTickets, getTicketClientHistory } from '@/api/tickets';
import { getMessages, sendMessage as sendMessageAPI, getAISummary } from '@/api/chat';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AgentDashboard } from '@/components/features/workspace/AgentDashboard';
import { ActiveQueue } from '@/components/features/workspace/ActiveQueue';
import DemandesAgent from '@/components/features/workspace/DemandesAgent';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, Activity, Cpu, X, Send, CheckCircle2, ArrowUpCircle,
  BrainCircuit, Loader2, User, Phone, Info, ShieldAlert, MapPin, FileText, Paperclip, Eye, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/api/axios';
import '@/components/features/workspace/workspace-view.css';

export default function WorkspaceView({ agentRole = 'agent' }) {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [clientHistory, setClientHistory] = useState([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [historyChats, setHistoryChats] = useState({});
  const messagesEndRef = useRef(null);

  // Fetch tickets
  const fetchTickets = async () => {
    setLoading(true);
    try {
      let data;
      if (agentRole === 'agent') {
        data = await getAgentTickets();
      } else {
        data = await getEscalatedTickets();
      }
      setTickets(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [agentRole]);

  // Filter tickets based on tab and search
  const filteredTickets = useMemo(() => {
    let filtered = tickets;
    if (activeTab === 'history') {
      filtered = filtered.filter(t => ['resolu', 'ferme'].includes(t.statut));
    } else if (activeTab === 'tickets') {
      filtered = filtered.filter(t => !['resolu', 'ferme'].includes(t.statut));
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        (t.numero_ticket || '').toLowerCase().includes(q) ||
        (t.titre || '').toLowerCase().includes(q) ||
        (t.client_nom || '').toLowerCase().includes(q) ||
        (t.client_prenom || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [tickets, activeTab, searchTerm]);

  // Open ticket drawer
  const handleOpenTicket = async (ticket) => {
    try {
      const detail = await getAgentTicketDetail(ticket.id);
      setSelectedTicket(detail);
    } catch {
      setSelectedTicket(ticket);
    }
    try {
      const msgs = await getMessages(ticket.id);
      setChatMessages(Array.isArray(msgs) ? msgs : msgs.results || []);
    } catch {
      setChatMessages([]);
    }
    setShowEscalation(false);
    setAiSummary(null);
    setShowHistoryPanel(false);
    setExpandedHistory(null);

    // Fetch client history
    try {
      const history = await getTicketClientHistory(ticket.id);
      setClientHistory(Array.isArray(history) ? history : history.results || []);
    } catch (err) {
      setClientHistory([]);
    }

    // Charger le résumé IA pour agents technique/annexe
    if (agentRole !== 'agent') {
      setLoadingAI(true);
      try {
        const summary = await getAISummary(ticket.id);
        setAiSummary(summary);
      } catch (err) {
        console.error('Failed to load AI summary:', err);
      } finally {
        setLoadingAI(false);
      }
    }
  };

  // WebSocket temps réel
  const { messages: wsMessages, sendMessage: wsSendMessage, isConnected } = useWebSocket(
    selectedTicket?.id || null
  );

  // Fusionner les messages HTTP (historique) + WS (temps réel)
  const allMessages = useMemo(() => {
    const httpIds = new Set(chatMessages.map(m => m.id));
    const newWsMessages = wsMessages.filter(m => !httpIds.has(m.id));
    return [...chatMessages, ...newWsMessages];
  }, [chatMessages, wsMessages]);

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  // Send chat message
  const handleSendMessage = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    const text = replyText;
    setReplyText(''); // Clear UI optimistically
    
    // Essayer WebSocket d'abord
    if (isConnected && wsSendMessage(text)) {
      return;
    }

    // Fallback HTTP
    try {
      const msg = await sendMessageAPI(selectedTicket.id, text);
      setChatMessages(prev => [...prev, msg]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Resolve ticket
  const handleResolve = async () => {
    if (!selectedTicket) return;
    try {
      await updateTicketStatus(selectedTicket.id, { statut: 'resolu', resolution: 'Résolu par l\'agent.' });
      setSelectedTicket(null);
      fetchTickets();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  // Escalate ticket
  const handleEscalate = async (type) => {
    if (!selectedTicket) return;
    setIsSummarizing(true);
    try {
      await escalateTicket(selectedTicket.id, {
        type_escalade: type,
        motif: `Escalade ${type} demandée par l'agent.`,
      });
      setSelectedTicket(null);
      setShowEscalation(false);
      fetchTickets();
    } catch (err) {
      console.error('Failed to escalate:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  // Preview attachment
  const handlePreview = async (pj) => {
    setLoadingPreview(true);
    try {
      const response = await api.get(`/tickets/pieces-jointes/${pj.id}/download/`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(response.data);
      setPreviewFile({ blobUrl, nom: pj.nom_fichier, type_mime: pj.type_mime });
    } catch (err) {
      console.error('Failed to load file:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewFile?.blobUrl) URL.revokeObjectURL(previewFile.blobUrl);
    setPreviewFile(null);
  };

  const roleLabels = {
    agent: 'Agent Support',
    agent_technique: 'Agent Technique',
    agent_annexe: 'Agent Annexe',
  };

  const isClosed = selectedTicket && ['resolu', 'ferme'].includes(selectedTicket.statut);
  const piecesJointes = selectedTicket?.pieces_jointes || [];

  return (
    <div className="workspace-view-container">
      {/* ─── Toolbar ─── */}
      <div className="workspace-toolbar">
        <div className="workspace-agent-info">
          <div className="workspace-role-icon">
            {agentRole === 'agent_technique' ? <Cpu className="w-8 h-8" /> : <Activity className="w-8 h-8" />}
          </div>
          <div className="workspace-agent-details">
            <h1 className="workspace-title">Console {roleLabels[agentRole] || 'Agent'}</h1>
            <p className="workspace-agent-name">{user?.prenom} {user?.nom}</p>
          </div>
        </div>
        <div className="workspace-actions">
          <div className="workspace-search-wrapper">
            <Search className="workspace-search-icon" />
            <Input placeholder={t('portal.search')} className="workspace-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Button variant={activeTab === 'dashboard' ? 'default' : 'outline'} className="workspace-nav-btn" onClick={() => setActiveTab('dashboard')}>{t('sidebar.performance')}</Button>
          <Button variant={activeTab === 'tickets' ? 'default' : 'outline'} className="workspace-nav-btn" onClick={() => setActiveTab('tickets')}>{t('sidebar.tickets')}</Button>
          <Button variant={activeTab === 'history' ? 'default' : 'outline'} className="workspace-nav-btn" onClick={() => setActiveTab('history')}>{t('sidebar.history')}</Button>
          <Button variant={activeTab === 'demandes' ? 'default' : 'outline'} className="workspace-nav-btn" onClick={() => setActiveTab('demandes')}>Demandes IT</Button>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="workspace-main-content">
        {activeTab === 'dashboard' ? (
          <AgentDashboard tickets={tickets} user={user} />
        ) : activeTab === 'demandes' ? (
          <div className="p-8 max-w-5xl mx-auto w-full"><DemandesAgent /></div>
        ) : (
          <ActiveQueue tickets={filteredTickets} onOpenTicket={handleOpenTicket} isHistory={activeTab === 'history'} />
        )}
      </div>

      {/* ─── Ticket Drawer ─── */}
      {selectedTicket && (
        <Card className="workspace-drawer">
          <CardHeader className="workspace-drawer-header">
            <div className="workspace-drawer-title-group">
              <CardTitle className="workspace-drawer-title">
                Dossier {selectedTicket.numero_ticket || selectedTicket.id}
              </CardTitle>
              <Badge className="workspace-drawer-badge">
                {selectedTicket.statut?.replace('_', ' ')}
              </Badge>
            </div>
            <div className="workspace-drawer-actions">
              <Button variant="ghost" className="workspace-escalate-btn" onClick={() => setShowHistoryPanel(!showHistoryPanel)}>
                <Calendar className="w-4 h-4 mr-2" />
                Historique
              </Button>
              {agentRole === 'agent' && !isClosed && (
                <Button variant="ghost" className="workspace-escalate-btn" onClick={() => setShowEscalation(!showEscalation)} disabled={isSummarizing}>
                  {isSummarizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpCircle className="w-4 h-4 mr-2" />}
                  {isSummarizing ? "..." : t('agent.escalate')}
                </Button>
              )}
              <Button size="icon" variant="ghost" className="workspace-close-btn" onClick={() => setSelectedTicket(null)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="workspace-drawer-content">
            {/* Escalation Panel */}
            {showEscalation && (
              <div className="workspace-escalation-panel">
                <p className="workspace-panel-label">Escalade Technique</p>
                <div className="workspace-escalation-grid">
                  <Button variant="outline" className="workspace-escalation-option" onClick={() => handleEscalate('technique')}>
                    <Cpu className="w-5 h-5 mb-2" />
                    <span className="text-[10px] font-black uppercase">{t('sidebar.brand_sub_technique')}</span>
                  </Button>
                  <Button variant="outline" className="workspace-escalation-option" onClick={() => handleEscalate('annexe')}>
                    <MapPin className="w-5 h-5 mb-2" />
                    <span className="text-[10px] font-black uppercase">{t('sidebar.brand_sub_annexe')}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* History Panel */}
            {showHistoryPanel && (
              <div className="p-8 bg-slate-50 border-b shadow-inner shrink-0 max-h-[30vh] overflow-y-auto">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Historique du client ({clientHistory.length})
                </p>
                {clientHistory.length > 0 ? (
                  <div className="space-y-4">
                    {clientHistory.map(hist => (
                      <div key={hist.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div 
                          className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={async () => {
                            if (expandedHistory === hist.id) {
                              setExpandedHistory(null);
                            } else {
                              setExpandedHistory(hist.id);
                              if (!historyChats[hist.id]) {
                                try {
                                  const msgs = await getMessages(hist.id);
                                  setHistoryChats(prev => ({ ...prev, [hist.id]: Array.isArray(msgs) ? msgs : msgs.results || [] }));
                                } catch (e) {
                                  setHistoryChats(prev => ({ ...prev, [hist.id]: [] }));
                                }
                              }
                            }
                          }}
                        >
                          <div>
                            <p className="text-xs font-black text-[#0055A4] uppercase flex items-center gap-2">
                              {hist.numero_ticket}
                              <Badge variant="outline" className="text-[8px] uppercase font-black bg-slate-100">{hist.statut}</Badge>
                            </p>
                            <p className="text-[10px] font-bold text-slate-500 mt-1">{hist.titre}</p>
                          </div>
                          <Eye className={cn("w-4 h-4 text-slate-400 transition-transform", expandedHistory === hist.id && "rotate-180")} />
                        </div>
                        {expandedHistory === hist.id && (
                          <div className="p-4 bg-slate-50 border-t border-slate-100 max-h-[300px] overflow-y-auto">
                            {!historyChats[hist.id] ? (
                              <p className="text-xs text-slate-400 font-bold text-center py-4 text-[10px] uppercase tracking-widest">Chargement...</p>
                            ) : historyChats[hist.id].length === 0 ? (
                              <p className="text-xs text-slate-400 font-bold text-center py-4 text-[10px] uppercase tracking-widest">Aucun message pour ce ticket</p>
                            ) : (
                              <div className="space-y-3">
                                {hist.description && (
                                  <div className="bg-white p-3 rounded-xl border">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Signalement Initial</p>
                                    <p className="text-xs font-bold text-slate-700">{hist.description}</p>
                                  </div>
                                )}
                                {historyChats[hist.id].map(msg => {
                                  const isAgent = msg.expediteur_role !== 'client';
                                  return (
                                    <div key={msg.id} className={cn("max-w-[85%] p-3 rounded-2xl text-xs", 
                                      isAgent ? "ml-auto bg-slate-200 text-slate-800 rounded-tr-none" 
                                              : "mr-auto bg-white border text-slate-800 rounded-tl-none"
                                    )}>
                                      <p className="font-bold">{msg.contenu}</p>
                                      <p className="text-[8px] font-black uppercase opacity-50 mt-1 text-right">
                                        {msg.expediteur_role} • {new Date(msg.date_envoi || msg.date).toLocaleString('fr-FR')}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-bold">Aucun autre ticket trouvé pour ce client.</p>
                )}
              </div>
            )}

            {/* Ticket Summary Bar */}
            <div className="workspace-ticket-summary-bar">
              <div className="workspace-summary-item">
                <User className="w-5 h-5 text-[#0055A4]" />
                <div>
                  <p className="item-label">Client</p>
                  <p className="item-value">{selectedTicket.client_nom} {selectedTicket.client_prenom}</p>
                </div>
              </div>
              <div className="workspace-summary-item">
                <Phone className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="item-label">Téléphone</p>
                  <p className="item-value">{selectedTicket.client_tel || '—'}</p>
                </div>
              </div>
              <div className="workspace-summary-item overflow-hidden">
                <Info className="w-5 h-5 text-[#0055A4] shrink-0" />
                <div className="truncate">
                  <p className="item-label">Service</p>
                  <p className="item-value truncate">{selectedTicket.type_service?.libelle || '—'}</p>
                </div>
              </div>
              <div className="workspace-summary-item">
                <Calendar className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="item-label">Créé le</p>
                  <p className="item-value">
                    {selectedTicket.created_at
                      ? new Date(selectedTicket.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
            {/* Description in bar */}
            {/* Description in bar */}
            {(selectedTicket.description || selectedTicket.resume_ia) && (
              <div className="px-6 py-4 bg-white border-b shrink-0 flex flex-col gap-4">
                {selectedTicket.description && (
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <FileText className="w-5 h-5 text-[#0055A4] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Description du Client</p>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedTicket.description}</p>
                    </div>
                  </div>
                )}
                {selectedTicket.resume_ia && (
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <BrainCircuit className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-purple-500 tracking-widest mb-1">Résumé IA (Triage Initial)</p>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">{selectedTicket.resume_ia}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pieces Jointes */}
            {piecesJointes.length > 0 && (
              <div className="workspace-pj-section">
                <p className="workspace-pj-label">
                  <Paperclip className="w-3.5 h-3.5" /> Pièces Jointes ({piecesJointes.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {piecesJointes.map(pj => (
                    <button key={pj.id} onClick={() => handlePreview(pj)} className="workspace-pj-item">
                      <FileText className="w-4 h-4 text-[#0055A4]" />
                      <span className="text-xs font-bold text-[#0055A4] underline">{pj.nom_fichier}</span>
                      <Eye className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Area */}
            <div className="workspace-chat-container">
              <div className="workspace-chat-wrapper">
                {agentRole !== 'agent' && (
                  <div className="workspace-ai-summary">
                    <div className="ai-header">
                      <BrainCircuit className="w-6 h-6" />
                      <p className="ai-label">Analyse IA — Résumé de la Discussion</p>
                    </div>
                    {loadingAI ? (
                      <div className="flex items-center gap-3 py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                        <span className="text-xs font-bold text-slate-400 uppercase">Analyse en cours…</span>
                      </div>
                    ) : aiSummary ? (
                      <div className="space-y-4">
                        <p className="ai-text">{aiSummary.resume}</p>
                        {/* Timeline */}
                        {aiSummary.timeline?.length > 0 && (
                          <div className="space-y-1.5 mt-3">
                            {aiSummary.timeline.map((item, i) => (
                              <p key={i} className="text-[11px] font-bold text-slate-500">{item}</p>
                            ))}
                          </div>
                        )}
                        {/* Stats */}
                        {aiSummary.stats && (
                          <div className="flex gap-4 mt-3">
                            <div className="bg-white/80 rounded-xl px-4 py-2 border border-purple-100 text-center">
                              <p className="text-lg font-black text-purple-600">{aiSummary.stats.total_messages}</p>
                              <p className="text-[9px] font-black uppercase text-slate-400">Messages</p>
                            </div>
                            <div className="bg-white/80 rounded-xl px-4 py-2 border border-purple-100 text-center">
                              <p className="text-lg font-black text-purple-600">{aiSummary.stats.duree_jours}j</p>
                              <p className="text-[9px] font-black uppercase text-slate-400">Durée</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Aucun résumé disponible</p>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div className="workspace-messages-list">
                  {allMessages.map((m, idx) => {
                    const isAgent = m.expediteur_role !== 'client';
                    const senderLabel = m.expediteur_role === 'client' ? 'Client' : 'Agent';
                    const dateStr = m.date_envoi ? new Date(m.date_envoi).toLocaleString('fr-FR') : '';

                    return (
                      <div key={m.id || idx} className={`workspace-msg-group ${isAgent ? 'outgoing' : 'incoming'}`}>
                        <div className={`workspace-msg-bubble ${isAgent ? 'outgoing' : 'incoming'}`}>
                          <p className="msg-text">{m.contenu || m.text}</p>
                          <div className="msg-meta">
                            <span>{senderLabel}</span>
                            <span>{dateStr}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {allMessages.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Aucun message pour le moment</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            {/* Footer */}
            {agentRole === 'agent' && !isClosed ? (
              <div className="workspace-chat-footer">
                <Button className="workspace-resolve-btn" onClick={handleResolve}>
                  <CheckCircle2 className="w-5 h-5 mr-3" /> Clôturer Ticket (Solution Rétablie)
                </Button>
                <div className="workspace-reply-form">
                  <Textarea
                    placeholder="Réponse à l'abonné..."
                    className="workspace-reply-input"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  />
                  <Button className="workspace-send-btn" onClick={handleSendMessage} disabled={!replyText.trim()}>
                    <Send className="w-7 h-7" />
                  </Button>
                </div>
              </div>
            ) : isClosed ? (
              <div className="workspace-readonly-footer">
                <ShieldAlert className="w-6 h-6 text-amber-600" />
                <p className="readonly-text">Archive : Lecture seule.</p>
              </div>
            ) : (
              <div className="workspace-readonly-footer">
                <ShieldAlert className="w-6 h-6 text-[#0055A4]" />
                <p className="readonly-text">Consultation experte — Pièces jointes et résumé IA disponibles ci-dessus.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── File Preview Modal ─── */}
      {loadingPreview && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-8 h-8 text-[#0055A4] animate-spin" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Chargement...</p>
          </div>
        </div>
      )}
      {previewFile && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center" onClick={closePreview}>
          <div className="w-full max-w-4xl flex items-center justify-between px-6 py-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-white" />
              <p className="text-white font-bold text-sm truncate max-w-md">{previewFile.nom}</p>
            </div>
            <button onClick={closePreview} className="text-white hover:text-red-400 transition-colors cursor-pointer bg-white/10 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full max-w-4xl max-h-[80vh] flex-1 flex items-center justify-center px-6 pb-6" onClick={e => e.stopPropagation()}>
            {previewFile.type_mime?.startsWith('image/') ? (
              <img src={previewFile.blobUrl} alt={previewFile.nom} className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl" />
            ) : previewFile.type_mime === 'application/pdf' ? (
              <iframe src={previewFile.blobUrl} title={previewFile.nom} className="w-full h-[75vh] rounded-2xl shadow-2xl bg-white" />
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-700">{previewFile.nom}</p>
                <p className="text-xs text-slate-400 mt-2">Aperçu non disponible</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
