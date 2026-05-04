import React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, UserCircle, Globe, Laptop, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminSessions({ sessions = [] }) {
  const { t } = useTranslation();
  // Parsing simple du User-Agent pour un affichage plus propre
  const parseUserAgent = (uaString = '') => {
    let browser = 'Inconnu';
    if (uaString.includes('Chrome')) browser = 'Chrome';
    else if (uaString.includes('Firefox')) browser = 'Firefox';
    else if (uaString.includes('Safari')) browser = 'Safari';
    else if (uaString.includes('Edge')) browser = 'Edge';

    let os = 'OS Inconnu';
    if (uaString.includes('Windows')) os = 'Windows';
    else if (uaString.includes('Mac OS')) os = 'macOS';
    else if (uaString.includes('Linux')) os = 'Linux';
    else if (uaString.includes('Android')) os = 'Android';
    else if (uaString.includes('iOS')) os = 'iOS';

    return `${browser} sur ${os}`;
  };

  return (
    <Card className="rounded-[2rem] shadow-2xl bg-white overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 p-8 flex flex-row items-center gap-6">
        <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 text-purple-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('admin.session_history')}</CardTitle>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">{t('sidebar.audit')}</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="pl-10 text-[11px] font-black uppercase h-16">Utilisateur</TableHead>
              <TableHead className="text-[11px] font-black uppercase">Adresse IP</TableHead>
              <TableHead className="text-[11px] font-black uppercase">Appareil & Navigateur</TableHead>
              <TableHead className="text-[11px] font-black uppercase">Résultat</TableHead>
              <TableHead className="pr-10 text-right text-[11px] font-black uppercase">Date et Heure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-bold uppercase text-[10px]">
                  {t('portal.no_tickets')}
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session, index) => (
                <TableRow key={index} className="h-20 hover:bg-slate-50 transition-all">
                  <TableCell className="pl-10">
                    <div className="flex items-center gap-3">
                      <UserCircle className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-black text-slate-900 uppercase tracking-tight text-sm leading-none">{session.utilisateur_nom || 'Inconnu'}</p>
                        {session.utilisateur_email && (
                          <p className="text-[10px] font-bold text-slate-400 mt-1">{session.utilisateur_email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-[#0055A4]" />
                      <span className="font-bold text-xs text-slate-600">{session.ip_adresse || 'Non disponible'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Laptop className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-xs text-slate-600">{parseUserAgent(session.user_agent)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {session.succes ? (
                      <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 px-3 py-1 flex items-center gap-1 w-fit shadow-none border-none text-[10px] uppercase font-black">
                        <CheckCircle2 className="w-3 h-3" /> OK
                      </Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-600 hover:bg-red-50 px-3 py-1 flex items-center gap-1 w-fit shadow-none border-none text-[10px] uppercase font-black">
                        <XCircle className="w-3 h-3" /> Échec {session.raison_echec && `(${session.raison_echec})`}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <p className="font-black text-[#0055A4] text-xs uppercase uppercase">
                      {new Date(session.connecte_a).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="font-bold text-slate-400 text-[10px]">
                      {new Date(session.connecte_a).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
