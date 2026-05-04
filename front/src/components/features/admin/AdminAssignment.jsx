import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Database, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assignTicket } from '@/api/admin';

const PRIORITY_MAP = {
  critique: { label: 'Critique', cls: 'border-red-500/30 text-red-600 bg-red-50' },
  haute:    { label: 'Haute',    cls: 'border-red-500/30 text-red-600 bg-red-50' },
  normale:  { label: 'Normale',  cls: 'border-slate-200 text-slate-600 bg-white' },
  basse:    { label: 'Basse',    cls: 'border-slate-200 text-slate-500 bg-white' },
};

export function AdminAssignment({ tickets = [], agents = [], onRefresh }) {
  const { t } = useTranslation();
  const unassigned = tickets.filter(t => !t.agent_nom && t.statut !== 'resolu' && t.statut !== 'ferme');
  const onlineAgents = agents.filter(a => a.actif);

  const handleAssign = async (ticketId, agentId) => {
    try {
      await assignTicket(ticketId, agentId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur d\'assignation');
    }
  };

  return (
    <Card className="rounded-[2rem] shadow-2xl bg-white overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 p-8 flex flex-row items-center gap-6">
        <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 text-[#0055A4]">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('sidebar.assignments')}</CardTitle>
          <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">Assignation Manuelle Chirurgicale</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="pl-10 text-[11px] font-black uppercase h-16">Ticket</TableHead>
              <TableHead className="text-[11px] font-black uppercase">{t('portal.service')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase">{t('portal.priority')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase">{t('portal.status')}</TableHead>
              <TableHead className="pr-10 text-right text-[11px] font-black uppercase">{t('sidebar.experts')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unassigned.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-bold uppercase text-[10px]">
                  Aucun ticket en attente d'assignation
                </TableCell>
              </TableRow>
            ) : (
              unassigned.map((ticket) => {
                const prio = PRIORITY_MAP[ticket.priorite] || PRIORITY_MAP.normale;
                return (
                  <TableRow key={ticket.id} className="h-20 hover:bg-slate-50 transition-all">
                    <TableCell className="pl-10">
                      <p className="font-black text-slate-900 text-base tracking-tighter">{ticket.numero_ticket}</p>
                      <p className="text-[11px] font-bold text-slate-400">{ticket.client_prenom} {ticket.client_nom}</p>
                    </TableCell>
                    <TableCell className="text-xs font-black uppercase text-slate-600 tracking-tight">
                      {ticket.type_service_libelle || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-md shadow-sm", prio.cls)}>
                        {prio.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="text-[9px] font-black uppercase px-3 py-1 bg-slate-100 text-slate-500 shadow-none border-none">
                        {ticket.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <select
                        onChange={(e) => { if (e.target.value) handleAssign(ticket.id, e.target.value); }}
                        defaultValue=""
                        className="w-52 h-11 text-[11px] font-black uppercase rounded-xl border border-slate-200 shadow-sm bg-white px-4 focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 cursor-pointer"
                      >
                        <option value="">{t('sidebar.experts')}</option>
                        {onlineAgents.map(agent => (
                          <option key={agent.id} value={agent.id}>
                            {agent.prenom} {agent.nom} ({agent.tickets_actifs || 0} actifs)
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
