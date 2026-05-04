import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, Award, Clock, Database, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#0055A4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function AdminOverview({ stats, performances: rawPerformances = [], tickets = [] }) {
  const { t } = useTranslation();
  const performances = Array.isArray(rawPerformances) ? rawPerformances : [];
  const [activeDimension, setActiveDimension] = React.useState('types');

  const DIMENSIONS = [
    { key: 'types', label: t('admin.dim_types') },
    { key: 'temps', label: t('admin.dim_time') },
    { key: 'priorite', label: t('admin.dim_priority') },
    { key: 'agents', label: t('admin.dim_agents') },
  ];

  // KPI cards
  const kpis = useMemo(() => {
    if (!stats) return [];
    const total = stats.total || 0;
    const resolus = (stats.resolus || 0) + (stats.fermes || 0);
    const resolution = total > 0 ? Math.round((resolus / total) * 100) : 0;
    const actifs = performances.filter(a => {
      if (!a.derniere_connexion) return false;
      return (Date.now() - new Date(a.derniere_connexion).getTime()) < 30 * 60 * 1000;
    }).length;
    return [
      { label: t('admin.volume'), value: total, icon: Database, trend: `${stats.en_cours || 0} ${t('admin.actifs')}`, color: 'text-[#0055A4]', bg: 'bg-blue-50' },
      { label: t('admin.resolution'), value: `${resolution}%`, icon: Award, trend: `${resolus} ${t('admin.resolved')}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: t('admin.active_experts'), value: `${actifs}/${performances.length}`, icon: Users, trend: t('admin.online'), color: 'text-amber-500', bg: 'bg-amber-50' },
      { label: t('admin.escalated'), value: stats.escalades || 0, icon: AlertTriangle, trend: t('admin.upper_level'), color: 'text-red-600', bg: 'bg-red-50' },
    ];
  }, [stats, performances]);

  // Dynamic chart data based on dimension
  const dynamicChartData = useMemo(() => {
    if (!stats) return [];
    switch (activeDimension) {
      case 'temps':
        return (stats.par_jour || []).map(d => ({
          name: new Date(d.jour).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
          value: d.count,
        }));
      case 'types':
        return (stats.par_type_service || []).map(d => ({
          name: d.libelle?.length > 20 ? d.libelle.slice(0, 20) + '…' : d.libelle,
          value: d.count,
        }));
      case 'priorite':
        if (!stats.par_priorite) return [];
        return Object.entries(stats.par_priorite).map(([name, value]) => ({ name, value }));
      case 'agents':
        return performances.map(a => ({
          name: `${a.prenom?.charAt(0)}. ${a.nom}`,
          value: a.tickets_resolus || 0,
        })).sort((a, b) => b.value - a.value);
      default: return [];
    }
  }, [stats, performances, activeDimension]);

  // Pie chart data (type distribution)
  const typeDistribution = useMemo(() => {
    if (!stats?.par_type_service) return [];
    const total = stats.par_type_service.reduce((s, t) => s + t.count, 0) || 1;
    return stats.par_type_service.map(d => ({
      name: d.libelle,
      value: Math.round((d.count / total) * 100),
    }));
  }, [stats]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 font-bold uppercase text-xs tracking-widest">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ─── KPI Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {kpis.map((stat, i) => (
          <Card key={i} className="rounded-3xl shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all">
            <CardContent className="p-8 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md">{stat.trend}</span>
                </div>
              </div>
              <div className={cn("p-5 rounded-[2.5rem] shadow-lg", stat.bg)}>
                <stat.icon className={cn("w-8 h-8", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Charts Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart - Multi Dimensions */}
        <Card className="lg:col-span-8 rounded-[2rem] shadow-2xl bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/30 p-8 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('admin.analytics')}</CardTitle>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{t('admin.intelligence')}</p>
            </div>
            <div className="flex gap-2 bg-slate-100 p-2 rounded-2xl">
              {DIMENSIONS.map(d => (
                <button
                  key={d.key}
                  onClick={() => setActiveDimension(d.key)}
                  className={cn(
                    "h-9 text-[10px] font-black uppercase tracking-tighter px-5 rounded-xl shadow-sm transition-all cursor-pointer",
                    activeDimension === d.key
                      ? "bg-[#0055A4] text-white shadow-lg shadow-[#0055A4]/20"
                      : "text-slate-500 hover:bg-white"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[450px] pt-12 px-8">
            <ResponsiveContainer width="100%" height="100%">
              {activeDimension === 'temps' ? (
                <AreaChart data={dynamicChartData}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0055A4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0055A4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} fontWeight="900" />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} fontWeight="900" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }} />
                  <Area type="monotone" dataKey="value" stroke="#0055A4" strokeWidth={5} fillOpacity={1} fill="url(#colorMain)" />
                </AreaChart>
              ) : (
                <BarChart data={dynamicChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} fontWeight="900" />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} fontWeight="900" allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                  <Bar dataKey="value" fill="#0055A4" radius={[12, 12, 0, 0]} barSize={activeDimension === 'agents' ? 60 : 45} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Mix Services */}
        <Card className="lg:col-span-4 rounded-[2rem] shadow-2xl bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/30 p-8">
            <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('admin.mix_services')}</CardTitle>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{t('admin.technical_split')}</p>
          </CardHeader>
          <CardContent className="h-[450px] flex flex-col items-center justify-center p-8">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value" stroke="none">
                    {typeDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
