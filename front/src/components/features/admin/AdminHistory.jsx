import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { History, UserCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminHistory({ tickets = [] }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const STATUS_MAP = {
    soumis:              { label: t('portal.open'),        cls: 'bg-slate-100 text-slate-500' },
    ouvert:              { label: t('portal.open'),        cls: 'bg-blue-100 text-blue-800' },
    en_cours:            { label: t('portal.in_progress'), cls: 'bg-amber-100 text-amber-800' },
    resolu:              { label: t('portal.resolved'),    cls: 'bg-emerald-100 text-emerald-800' },
    ferme:               { label: t('portal.closed'),      cls: 'bg-slate-100 text-slate-600' },
    rejete:              { label: t('portal.rejected'),    cls: 'bg-red-100 text-red-800' },
    escalade_technique:  { label: 'Escalade Tech.',        cls: 'bg-purple-100 text-purple-800' },
    escalade_annexe:     { label: 'Escalade Annexe',       cls: 'bg-orange-100 text-orange-800' },
  };

  const filtered = tickets.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.numero_ticket?.toLowerCase().includes(q) ||
      t.client_nom?.toLowerCase().includes(q) ||
      t.client_prenom?.toLowerCase().includes(q) ||
      t.titre?.toLowerCase().includes(q);
  });

  return (
    <Card className="rounded-[2rem] shadow-2xl bg-white overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 p-8 flex flex-row items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 text-amber-600">
            <History className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('sidebar.history')}</CardTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">Traçabilité complète des réclamations</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder={t('portal.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 w-56" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="pl-10 text-[11px] font-black uppercase h-16">Ticket ID</TableHead>
              <TableHead className="text-[11px] font-black uppercase">{t('portal.service')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase">Client</TableHead>
              <TableHead className="text-[11px] font-black uppercase">{t('sidebar.experts')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase">Date</TableHead>
              <TableHead className="pr-10 text-right text-[11px] font-black uppercase">{t('portal.status')}</TableHead>
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
              filtered.map((t) => {
                const statusInfo = STATUS_MAP[t.statut] || STATUS_MAP.ouvert;
                return (
                  <TableRow key={t.id} className="h-20 hover:bg-slate-50 transition-all">
                    <TableCell className="pl-10">
                      <p className="font-black text-slate-900 text-sm uppercase tracking-tight leading-none">{t.numero_ticket}</p>
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-slate-600 uppercase">
                      {t.type_service_libelle || '—'}
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-slate-600">
                      {t.client_prenom} {t.client_nom}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-slate-400" />
                        <span className="text-[11px] font-black text-slate-700 uppercase">
                          {t.agent_prenom ? `${t.agent_prenom} ${t.agent_nom}` : 'Non assigné'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[11px] font-black text-[#0055A4] uppercase">
                      {new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <Badge className={cn("text-[10px] font-black uppercase shadow-none px-4 py-1 rounded-full border-none", statusInfo.cls)}>
                        {statusInfo.label}
                      </Badge>
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
