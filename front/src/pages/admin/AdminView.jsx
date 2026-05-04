import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/contexts/AuthContext';
import { getAdminStats, getAgentsPerformance, getAgentsList, getAllTickets, exportPDF, exportExcel, getSessionHistory, updateCentreParams, getCentreParams } from '@/api/admin';
import { getMessages } from '@/api/chat';
import { AdminOverview } from '@/components/features/admin/AdminOverview';
import { AgentManagement } from '@/components/features/admin/AgentManagement';
import { AdminAssignment } from '@/components/features/admin/AdminAssignment';
import { AdminHistory } from '@/components/features/admin/AdminHistory';
import { AdminSessions } from '@/components/features/admin/AdminSessions';
import { DemandesAdmin } from '@/components/features/admin/DemandesAdmin';
import { Cpu, Activity, Search, UserCircle, Filter, Calendar as CalendarIcon, X, FileDown, FileSpreadsheet, Loader2, MessageSquare, Eye } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function AdminView() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'stats';
  const [stats, setStats] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [agents, setAgents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [auditAgent, setAuditAgent] = useState(null);
  const [auditTickets, setAuditTickets] = useState([]);
  const [auditMessages, setAuditMessages] = useState([]);
  const [auditSelectedTicket, setAuditSelectedTicket] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Toolbar filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [assignmentMode, _setAssignmentMode] = useState('auto');
  const setAssignmentMode = async (mode) => {
    _setAssignmentMode(mode);
    try {
      await updateCentreParams({ attribution_auto_active: mode === 'auto' });
    } catch (e) {
      console.error('Erreur lors de la mise à jour des paramètres du centre', e);
    }
  };


  const fetchAll = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const filters = {};
      if (filterService !== 'all' && activeTab !== 'sessions') filters.service = filterService;
      if (filterAgent !== 'all' && activeTab !== 'sessions') filters.agent_id = filterAgent;
      if (filterStartDate) filters.start_date = filterStartDate;
      if (filterEndDate) filters.end_date = filterEndDate;

      const sessionFilters = {
        search: searchTerm,
        start_date: filterStartDate,
        end_date: filterEndDate,
      };
      if (filterAgent !== 'all' && activeTab === 'sessions') {
        sessionFilters.role = filterAgent;
      }

      const [s, p, a, t, sess, centreParams] = await Promise.all([
        getAdminStats(filters).catch(() => null),
        getAgentsPerformance(filters).catch(() => []),
        getAgentsList().catch(() => []),
        getAllTickets(filters).catch(() => []),
        getSessionHistory(sessionFilters).catch(() => []),
        getCentreParams().catch(() => null),
      ]);
      if (centreParams) {
        _setAssignmentMode(centreParams.attribution_auto_active ? 'auto' : 'manual');
      }
      setStats(s);
      setPerformances(p);
      setAgents(a);
      setSessions(sess);
      
      // Local search filtering for tickets (frontend only)
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        setTickets(t.filter(ticket => 
          ticket.numero_ticket?.toLowerCase().includes(q) ||
          ticket.client_nom?.toLowerCase().includes(q) ||
          ticket.client_prenom?.toLowerCase().includes(q)
        ));
      } else {
        setTickets(t);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [filterService, filterAgent, filterStartDate, filterEndDate, searchTerm, activeTab]);

  useEffect(() => {
    fetchAll();
    
    // Auto-refresh pour voir les nouveaux tickets (toutes les 10s si on est sur la tab assignment)
    const intervalId = setInterval(() => {
      // Refresh background only
      fetchAll(true);
    }, 10000);
    return () => clearInterval(intervalId);
  }, [fetchAll]);

  // Audit agent: filter tickets assigned to this agent
  const handleAuditAgent = (agent) => {
    setAuditAgent(agent);
    setAuditSelectedTicket(null);
    setAuditMessages([]);
    const agentTickets = tickets.filter(t => 
      t.agent_nom === agent.nom || 
      String(t.agent) === String(agent.id)
    );
    setAuditTickets(agentTickets);
  };

  const handleAuditSelectTicket = async (ticket) => {
    setAuditSelectedTicket(ticket);
    setAuditLoading(true);
    try {
      const msgs = await getMessages(ticket.id);
      setAuditMessages(Array.isArray(msgs) ? msgs : msgs.results || []);
    } catch (err) {
      console.error('Failed to load audit messages:', err);
      setAuditMessages([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try { await exportPDF(); } catch (e) { alert('Erreur export PDF'); }
    finally { setExporting(false); }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try { await exportExcel(); } catch (e) { alert('Erreur export Excel'); }
    finally { setExporting(false); }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterService('all');
    setFilterAgent('all');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const hasFilters = searchTerm || filterService !== 'all' || filterAgent !== 'all' || filterStartDate || filterEndDate;

  // Get unique services from tickets for filter dropdown
  const serviceTypes = [...new Set(tickets.map(t => t.type_service_libelle).filter(Boolean))];

  return (
    <div className="space-y-10">
      {/* ─── Toolbar ──────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-white p-8 rounded-3xl border shadow-xl">
        {/* Left side - Branding */}
        <div className="flex items-center gap-6">
          <div className="bg-[#0055A4]/5 p-4 rounded-3xl border border-[#0055A4]/10 text-[#0055A4]">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{t('admin.console_title')}</h1>
            <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest mt-3 flex items-center gap-2">
              <Activity className="w-4 h-4 animate-pulse" /> {t('admin.realtime')}
            </p>
          </div>
        </div>

        {/* Right side - Filters */}
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {/* Search */}
          <div className="relative flex-1 xl:w-64 min-w-[200px]">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              placeholder={t('admin.search_placeholder')}
              className="pl-12 h-12 w-full rounded-2xl text-xs font-bold bg-slate-50/50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Service filter */}
          {activeTab !== 'sessions' && (
            <div className="flex items-center gap-2">
              <select value={filterService} onChange={(e) => setFilterService(e.target.value)}
                className="h-12 min-w-[12rem] text-[10px] font-black uppercase rounded-2xl shadow-sm bg-white border border-slate-200 px-4 focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 cursor-pointer">
                <option value="all">{t('portal.all')}</option>
                {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}

          {/* Agent filter */}
          <div className="flex items-center gap-2">
            {activeTab === 'sessions' ? (
              <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}
                className="h-12 min-w-[12rem] text-[10px] font-black uppercase rounded-2xl shadow-sm bg-white border border-slate-200 px-4 focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 cursor-pointer">
                <option value="all">{t('portal.all')}</option>
                <option value="clients">Clients</option>
                <option value="staff">Staff (Experts, Admins...)</option>
              </select>
            ) : (
              <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}
                className="h-12 min-w-[12rem] text-[10px] font-black uppercase rounded-2xl shadow-sm bg-white border border-slate-200 px-4 focus:outline-none focus:ring-2 focus:ring-[#0055A4]/20 cursor-pointer">
                <option value="all">{t('sidebar.experts')}</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
              </select>
            )}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border shadow-inner">
            <CalendarIcon className="w-4 h-4 text-[#0055A4]" />
            <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)}
              className="h-8 w-32 text-[10px] bg-transparent border-none shadow-none focus:outline-none font-bold p-0" />
            <span className="text-slate-300 font-black text-xs">à</span>
            <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)}
              className="h-8 w-32 text-[10px] bg-transparent border-none shadow-none focus:outline-none font-bold p-0" />
          </div>

          {/* Reset filters */}
          {hasFilters && (
            <button onClick={handleResetFilters}
              className="h-12 w-12 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Export buttons (Stats tab only) */}
          {activeTab === 'stats' && (
            <div className="flex items-center gap-2 pl-6 border-l h-12">
              <button 
                onClick={handleExportPDF} disabled={exporting}
                className="flex items-center gap-2 h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0055A4] bg-[#0055A4]/5 hover:bg-[#0055A4]/10 transition-colors"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                {t('admin.export_pdf')}
              </button>
              <button 
                onClick={handleExportExcel} disabled={exporting}
                className="flex items-center gap-2 h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                {t('admin.export_excel')}
              </button>
            </div>
          )}

          {/* Assignment mode toggle */}
          <div className="flex items-center gap-4 pl-6 border-l h-12">
            <div className="text-right">
              <label className="text-[9px] font-black uppercase text-slate-400 block tracking-widest">{t('admin.auto_assign')}</label>
              <p className={cn("text-[10px] font-black mt-0.5",
                assignmentMode === 'auto' ? "text-emerald-600" : "text-amber-500"
              )}>
                {assignmentMode === 'auto' ? t('admin.enabled') : t('admin.manual')}
              </p>
            </div>
            <button
              onClick={() => setAssignmentMode(assignmentMode === 'auto' ? 'manual' : 'auto')}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                assignmentMode === 'auto' ? "bg-[#0055A4]" : "bg-slate-300"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                assignmentMode === 'auto' ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tab Content ──────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <AdminOverview stats={stats} performances={performances} tickets={tickets} />
      )}

      {activeTab === 'assignment' && assignmentMode === 'manual' && (
        <AdminAssignment tickets={tickets} agents={agents} onRefresh={fetchAll} />
      )}

      {activeTab === 'assignment' && assignmentMode === 'auto' && (
        <div className="bg-white rounded-3xl shadow-xl border p-16 text-center">
          <div className="bg-emerald-50 p-6 rounded-3xl inline-block mb-6">
            <Activity className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-3">Mode Automatique Activé</h2>
          <p className="text-sm font-bold text-slate-400 max-w-lg mx-auto">
            Les tickets sont automatiquement assignés à l'expert le moins chargé. Désactivez le mode auto dans la barre d'outils pour passer en assignation manuelle.
          </p>
        </div>
      )}

      {activeTab === 'agents' && (
        <AgentManagement agents={agents} performances={performances} onRefresh={fetchAll} onAuditAgent={handleAuditAgent} readOnly={true} />
      )}

      {activeTab === 'history' && (
        <AdminHistory tickets={tickets} />
      )}

      {activeTab === 'demandes' && (
        <DemandesAdmin />
      )}

      {/* ─── Audit Modal ─── */}
      {auditAgent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-slate-50/50 flex items-center gap-4">
              <div className="bg-[#0055A4]/10 p-3 rounded-xl">
                <Eye className="w-5 h-5 text-[#0055A4]" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black uppercase tracking-tighter text-[#0055A4]">Audit — {auditAgent.prenom} {auditAgent.nom}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Lecture seule des conversations</p>
              </div>
              <button onClick={() => { setAuditAgent(null); setAuditSelectedTicket(null); setAuditMessages([]); }} className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Tickets list */}
              <div className="w-1/3 border-r overflow-y-auto">
                {auditLoading ? (
                  <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-[#0055A4]" /></div>
                ) : auditTickets.length === 0 ? (
                  <p className="p-6 text-center text-xs text-slate-400 font-bold uppercase">Aucun ticket</p>
                ) : (
                  auditTickets.map(t => (
                    <button key={t.id} onClick={() => handleAuditSelectTicket(t)}
                      className={`w-full text-left px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                        auditSelectedTicket?.id === t.id ? 'bg-[#0055A4]/5 border-l-4 border-l-[#0055A4]' : ''
                      }`}>
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{t.numero_ticket}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 line-clamp-1">{t.titre}</p>
                      <p className="text-[9px] text-slate-300 font-bold mt-0.5">{t.client_prenom} {t.client_nom} — {t.statut}</p>
                    </button>
                  ))
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 flex flex-col">
                {!auditSelectedTicket ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sélectionnez un ticket</p>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-3">
                      {auditMessages.map((m, idx) => {
                        const isClient = (m.expediteur_role || m.expediteur_type) === 'client';
                        return (
                          <div key={m.id || idx} className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                              isClient
                                ? 'bg-slate-100 text-slate-800 rounded-tl-none'
                                : 'bg-[#0055A4] text-white rounded-tr-none'
                            }`}>
                              <p className="font-bold leading-relaxed">{m.contenu}</p>
                              <p className={`text-[9px] mt-2 font-black uppercase opacity-60 ${
                                isClient ? 'text-slate-400' : 'text-white'
                              }`}>
                                {isClient ? 'Client' : (m.expediteur_prenom || 'Agent')} • {m.date_envoi ? new Date(m.date_envoi).toLocaleString('fr-FR') : new Date(m.created_at).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {auditMessages.length === 0 && (
                        <p className="text-center text-xs text-slate-400 font-bold uppercase py-10">Aucun message</p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
