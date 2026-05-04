import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, Trash2 } from 'lucide-react';
import { deleteTicket } from '@/api/tickets';
import { cn } from '@/lib/utils';

export function CustomerTicketList({ tickets, loading, onSelectTicket, onTicketDeleted }) {
  const { t } = useTranslation();

  const STATUS_MAP = {
    soumis: { label: 'Nouveau', color: 'bg-indigo-100 text-indigo-700' },
    ouvert: { label: t('portal.open'), color: 'bg-blue-100 text-blue-800' },
    en_cours: { label: t('portal.in_progress'), color: 'bg-amber-100 text-amber-800' },
    resolu: { label: t('portal.resolved'), color: 'bg-emerald-100 text-emerald-800' },
    ferme: { label: t('portal.closed'), color: 'bg-slate-100 text-slate-600' },
    rejete: { label: t('portal.rejected'), color: 'bg-red-100 text-red-800' },
    escalade_technique: { label: 'Escalade Tech.', color: 'bg-purple-100 text-purple-800' },
    escalade_annexe: { label: 'Escalade Annexe', color: 'bg-orange-100 text-orange-800' },
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('common.loading')}</p>
      </div>
    );
  }

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">{t('portal.no_tickets')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {tickets.map(ticket => {
        const statusInfo = STATUS_MAP[ticket.statut] || STATUS_MAP.ouvert;
        const ticketRef = ticket.numero_ticket || `REQ-${String(ticket.id).padStart(3, '0')}`;
        const dateStr = ticket.created_at
          ? new Date(ticket.created_at).toLocaleDateString('fr-FR')
          : '';

        return (
          <Card key={ticket.id} className="shadow-xl border-slate-200 bg-white rounded-2xl overflow-hidden hover:border-[#0055A4] transition-all">
            <CardHeader className="flex flex-row items-center justify-between py-6 px-8 border-b bg-slate-50/50">
              <div>
                <span className="text-xl font-black text-[#0055A4] tracking-tighter uppercase leading-tight">
                  {ticketRef}
                </span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {dateStr}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <Badge className={cn(
                  "px-4 py-1 text-[9px] font-black uppercase rounded-full shadow-none",
                  statusInfo.color
                )}>
                  {statusInfo.label}
                </Badge>
                {ticket.statut === 'soumis' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) return;
                      try {
                        await deleteTicket(ticket.id);
                        if (onTicketDeleted) onTicketDeleted();
                      } catch (err) {
                        alert('Erreur lors de la suppression.');
                      }
                    }}
                    className="p-1.5 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    title="Supprimer le ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-3 py-1 border-slate-200">
                  {ticket.type_service_libelle || 'Service'}
                </Badge>
              </div>
              <p className="text-sm font-bold text-slate-600 italic line-clamp-2">
                "{ticket.titre}"
              </p>

              {ticket.resume_ia && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mt-4">
                  <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest mb-1 flex items-center gap-1">
                    Résumé IA
                  </p>
                  <p className="text-xs font-medium text-slate-700 line-clamp-3">
                    {ticket.resume_ia}
                  </p>
                </div>
              )}

              <div className="pt-6 border-t flex justify-between items-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10 text-[10px] font-black uppercase px-6 rounded-xl"
                  onClick={() => onSelectTicket(ticket)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> {t('sidebar.tickets')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
