import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, ChevronRight, ClipboardList, History, AlertTriangle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActiveQueue({ tickets, onOpenTicket, isHistory = false }) {
  const { t } = useTranslation();

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

  function getSlaInfo(ticket) {
    if (!ticket.echeance_sla) return { remains: null, percent: 100, isLate: false };
    const now = new Date();
    const deadline = new Date(ticket.echeance_sla);
    const created = new Date(ticket.created_at);
    const totalMs = deadline - created;
    const remainMs = deadline - now;
    const remains = Math.round(remainMs / (1000 * 60 * 60));
    const percent = totalMs > 0 ? Math.max(0, Math.min(100, (remainMs / totalMs) * 100)) : 0;
    return { remains, percent, isLate: remains < 0 };
  }
  return (
    <div className="bg-white rounded-3xl shadow-2xl border overflow-hidden">
      <div className="p-8 border-b bg-slate-50/30 flex items-center gap-4">
        {isHistory ? <History className="w-6 h-6 text-[#0055A4]" /> : <ClipboardList className="w-6 h-6 text-[#0055A4]" />}
        <h2 className="text-2xl font-black uppercase tracking-tighter">
          {isHistory ? t('sidebar.history') : t('agent.active_queue')}
        </h2>
        <Badge className="bg-[#0055A4]/10 text-[#0055A4] border-none shadow-none text-[10px] font-black px-3 py-1 ml-2">
          {tickets.length}
        </Badge>
      </div>
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead className="pl-10 text-[11px] font-black uppercase h-16">Ticket</TableHead>
            <TableHead className="text-[11px] font-black uppercase">{t('portal.service')}</TableHead>
            <TableHead className="text-[11px] font-black uppercase">{t('portal.priority')}</TableHead>
            <TableHead className="text-[11px] font-black uppercase">{isHistory ? t('portal.status') : 'SLA'}</TableHead>
            <TableHead className="pr-10 text-right text-[11px] font-black uppercase">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-bold uppercase text-[10px]">
                {t('portal.no_tickets')}
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket) => {
              const sla = getSlaInfo(ticket);
              const statusInfo = STATUS_MAP[ticket.statut] || STATUS_MAP.ouvert;
              const priorityInfo = PRIORITY_MAP[ticket.priorite] || PRIORITY_MAP.normale;
              const ref = ticket.numero_ticket || `TKT-${ticket.id}`;

              return (
                <TableRow key={ticket.id} className="h-24 hover:bg-slate-50">
                  {/* Ticket ID + Client */}
                  <TableCell className="pl-10">
                    <p className="font-black text-slate-900 text-base tracking-tighter uppercase flex items-center gap-1.5">
                      {ref}
                      {ticket.source === 'email' && <Mail className="w-3.5 h-3.5 text-blue-500" />}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400">
                      {ticket.client_nom} {ticket.client_prenom}
                    </p>
                  </TableCell>

                  {/* Service */}
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-black uppercase">
                      {ticket.type_service_libelle || 'Service'}
                    </Badge>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <Badge className={cn("text-[9px] font-black uppercase px-3 py-1 border shadow-none", priorityInfo.color)}>
                      {priorityInfo.label}
                    </Badge>
                  </TableCell>

                  {/* SLA or Status */}
                  <TableCell>
                    {isHistory ? (
                      <Badge className={cn("border-none text-[9px] font-black uppercase px-3 py-1 shadow-none", statusInfo.color)}>
                        {statusInfo.label}
                      </Badge>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {sla.isLate ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span className={cn("text-[10px] font-black", sla.isLate ? "text-red-600" : "text-emerald-600")}>
                            {sla.remains !== null ? (sla.isLate ? 'En retard' : `${sla.remains}h restantes`) : '—'}
                          </span>
                        </div>
                        <Progress value={sla.percent} className="h-1.5 w-32" />
                      </div>
                    )}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="pr-10 text-right">
                    <Button
                      size="sm"
                      className="h-11 px-6 rounded-xl font-black text-[10px] uppercase shadow-lg bg-[#0055A4] text-white cursor-pointer"
                      onClick={() => onOpenTicket(ticket)}
                    >
                      Consulter <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
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
