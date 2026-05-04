import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminTicketList({ tickets = [] }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');

  const STATUS_MAP = {
    soumis: { label: t('portal.open'), color: 'bg-slate-100 text-slate-500' },
    ouvert: { label: t('portal.open'), color: 'bg-blue-100 text-blue-800' },
    en_cours: { label: t('portal.in_progress'), color: 'bg-amber-100 text-amber-800' },
    resolu: { label: t('portal.resolved'), color: 'bg-emerald-100 text-emerald-800' },
    ferme: { label: t('portal.closed'), color: 'bg-slate-100 text-slate-600' },
    rejete: { label: t('portal.rejected'), color: 'bg-red-100 text-red-800' },
    escalade_technique: { label: 'Escalade Tech.', color: 'bg-purple-100 text-purple-800' },
    escalade_annexe: { label: 'Escalade Annexe', color: 'bg-orange-100 text-orange-800' },
  };

  const PRIORITY_MAP = {
    critique: { label: 'Critique', color: 'bg-red-100 text-red-800 border-red-200' },
    haute: { label: 'Haute', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    normale: { label: 'Normale', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    basse: { label: 'Basse', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  const filtered = tickets.filter(t => {
    const matchesSearch = searchQuery === '' ||
      t.numero_ticket?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client_nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client_prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.titre?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatut = filterStatut === 'all' || t.statut === filterStatut;
    return matchesSearch && matchesStatut;
  });

  return (
    <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b bg-slate-50/30 flex items-center gap-4 flex-wrap">
        <ClipboardList className="w-6 h-6 text-[#0055A4]" />
        <h2 className="text-2xl font-black uppercase tracking-tighter">{t('sidebar.tickets')}</h2>
        <Badge className="bg-[#0055A4]/10 text-[#0055A4] border-none shadow-none text-[10px] font-black px-3 py-1">
          {filtered.length} / {tickets.length}
        </Badge>
        <div className="ml-auto flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder={t('portal.search')}
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 w-56"
            />
          </div>
          {/* Status filter */}
          <select
            value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-[10px] font-black uppercase bg-white focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 cursor-pointer"
          >
            <option value="all">{t('portal.all')}</option>
            {Object.entries(STATUS_MAP).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="pl-10 text-[11px] font-black uppercase h-16">Ticket</TableHead>
            <TableHead className="text-[11px] font-black uppercase">Client</TableHead>
            <TableHead className="text-[11px] font-black uppercase">Agent</TableHead>
            <TableHead className="text-[11px] font-black uppercase">{t('portal.status')}</TableHead>
            <TableHead className="text-[11px] font-black uppercase">{t('portal.priority')}</TableHead>
            <TableHead className="pr-10 text-right text-[11px] font-black uppercase">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-bold uppercase text-[10px]">
                {t('portal.no_tickets')}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((ticket) => {
              const statusInfo = STATUS_MAP[ticket.statut] || STATUS_MAP.ouvert;
              const priorityInfo = PRIORITY_MAP[ticket.priorite] || PRIORITY_MAP.normale;
              return (
                <TableRow key={ticket.id} className="h-20 hover:bg-slate-50">
                  <TableCell className="pl-10">
                    <p className="font-black text-slate-900 text-sm tracking-tighter uppercase">{ticket.numero_ticket}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 line-clamp-1">{ticket.titre}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-bold text-slate-700">{ticket.client_prenom} {ticket.client_nom}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-bold text-slate-700">{ticket.agent_prenom ? `${ticket.agent_prenom} ${ticket.agent_nom}` : '—'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("border-none text-[9px] font-black uppercase px-3 py-1 shadow-none", statusInfo.color)}>
                      {statusInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[9px] font-black uppercase px-3 py-1 border shadow-none", priorityInfo.color)}>
                      {priorityInfo.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-10 text-right">
                    <p className="text-[10px] font-bold text-slate-400">
                      {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
