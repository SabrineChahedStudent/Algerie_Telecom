import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Activity, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

// Génère des données de volume simulées (sera remplacé par des vrais stats plus tard)
const MOCK_VOLUME_DATA = [
  { time: '08h', v: 4 }, { time: '09h', v: 6 }, { time: '10h', v: 8 },
  { time: '11h', v: 7 }, { time: '12h', v: 5 }, { time: '14h', v: 11 },
  { time: '15h', v: 9 }, { time: '16h', v: 7 },
];

export function AgentDashboard({ tickets = [], user }) {
  const { t } = useTranslation();
  // Calculer les KPIs à partir des tickets réels
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const resolvedToday = tickets.filter(t => 
      t.statut === 'resolu' && t.resolu_a && new Date(t.resolu_a).toDateString() === today
    ).length;

    const activeTickets = tickets.filter(t => !['resolu', 'ferme'].includes(t.statut)).length;
    const totalTickets = tickets.length;
    const resolvedTotal = tickets.filter(t => t.statut === 'resolu' || t.statut === 'ferme').length;

    // SLA: calculer le % de tickets dans les délais
    const ticketsWithSla = tickets.filter(t => t.echeance_sla);
    const ticketsOnTime = ticketsWithSla.filter(t => {
      if (t.statut === 'resolu' && t.resolu_a) {
        return new Date(t.resolu_a) <= new Date(t.echeance_sla);
      }
      return new Date() <= new Date(t.echeance_sla);
    });
    const slaPercent = ticketsWithSla.length > 0 ? Math.round((ticketsOnTime.length / ticketsWithSla.length) * 100) : 100;

    // Score satisfaction moyen
    const ratedTickets = tickets.filter(t => t.satisfaction_client);
    const avgSatisfaction = ratedTickets.length > 0
      ? (ratedTickets.reduce((sum, t) => sum + t.satisfaction_client, 0) / ratedTickets.length).toFixed(1)
      : '—';

    return { resolvedToday, activeTickets, totalTickets, resolvedTotal, slaPercent, avgSatisfaction };
  }, [tickets]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left Column - Main Stats */}
      <div className="lg:col-span-8 space-y-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-6">
          <Card className="rounded-3xl shadow-xl bg-white">
            <CardContent className="p-10 text-center">
              <p className="text-[11px] font-black text-slate-400 uppercase mb-4">{t('agent.resolved_today')}</p>
              <h3 className="text-6xl font-black text-[#0055A4] tracking-tighter">{stats.resolvedToday}</h3>
              <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 mt-6 px-6 py-2 rounded-xl text-[10px] font-black shadow-none">
                <CheckCircle2 className="w-3 h-3 mr-1" /> {stats.resolvedTotal} total résolus
              </Badge>
            </CardContent>
          </Card>
          <Card className="rounded-3xl shadow-xl bg-white">
            <CardContent className="p-10 text-center">
              <p className="text-[11px] font-black text-slate-400 uppercase mb-4">{t('agent.satisfaction')}</p>
              <h3 className="text-6xl font-black text-amber-500 tracking-tighter">{stats.avgSatisfaction}</h3>
              <div className="flex justify-center gap-1 mt-6">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={cn("w-5 h-5",
                    s <= Math.round(parseFloat(stats.avgSatisfaction) || 0)
                      ? "fill-amber-500 text-amber-500"
                      : "text-slate-200"
                  )} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Volume Chart */}
        <Card className="rounded-3xl shadow-xl bg-white overflow-hidden h-[400px]">
          <CardHeader className="bg-slate-50/50 border-b p-8">
            <CardTitle className="text-xl font-black text-slate-900 uppercase">{t('sidebar.history')}</CardTitle>
          </CardHeader>
          <CardContent className="p-8 h-full">
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={MOCK_VOLUME_DATA}>
                <defs>
                  <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0055A4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0055A4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={11} fontWeight="bold" />
                <YAxis axisLine={false} tickLine={false} fontSize={11} fontWeight="bold" />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="v" stroke="#0055A4" strokeWidth={4} fillOpacity={1} fill="url(#colorV)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - SLA & Session */}
      <div className="lg:col-span-4 space-y-10">
        <Card className="rounded-3xl shadow-xl bg-white">
          <CardHeader className="bg-slate-50/50 border-b p-8">
            <CardTitle className="text-xl font-black uppercase">Respect SLAs</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-black uppercase">
                <span className="text-slate-500">Respect Global</span>
                <span className="text-[#0055A4]">{stats.slaPercent}%</span>
              </div>
              <Progress value={stats.slaPercent} className="h-3" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[11px] font-black uppercase">
                <span className="text-slate-500">Tickets Actifs</span>
                <span className="text-amber-600">{stats.activeTickets}</span>
              </div>
              <Progress value={stats.activeTickets > 0 ? Math.min(100, stats.activeTickets * 10) : 0} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-xl bg-white">
          <CardHeader className="bg-slate-50/50 border-b p-8">
            <CardTitle className="text-xl font-black uppercase">Statut Session</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400">Statut</p>
                <p className="text-lg font-black text-emerald-600 tracking-tighter">En ligne</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-2xl text-[#0055A4]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400">Charge</p>
                <p className="text-lg font-black text-slate-900 tracking-tighter">{stats.activeTickets} tickets actifs</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 p-3 rounded-2xl text-purple-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase text-slate-400">Total traités</p>
                <p className="text-lg font-black text-slate-900 tracking-tighter">{stats.totalTickets} dossiers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
