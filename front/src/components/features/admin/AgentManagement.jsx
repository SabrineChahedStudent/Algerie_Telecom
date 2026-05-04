import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Plus, ChevronRight, Trash2, X, UserCircle, Award, UserPlus, Cpu, MapPin, Shield, Pencil, ToggleLeft, ToggleRight, AlertTriangle, Filter, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createAgent, deleteAgent, updateAgent } from '@/api/admin';
import api from '@/api/axios';

const ROLE_MAP = {
  agent:            { label: 'Agent',       color: 'bg-blue-100 text-blue-800',    icon: Shield },
  agent_technique:  { label: 'Technicien',  color: 'bg-purple-100 text-purple-800', icon: Cpu },
  agent_annexe:     { label: 'Annexe',      color: 'bg-orange-100 text-orange-800', icon: MapPin },
  admin:            { label: 'Manager',     color: 'bg-emerald-100 text-emerald-800', icon: Award },
};

function getStatusInfo(agent) {
  if (!agent.actif) return { label: 'Inactif', dot: 'bg-red-500' };
  if (agent.derniere_connexion) {
    const diff = Date.now() - new Date(agent.derniere_connexion).getTime();
    if (diff < 30 * 60 * 1000) return { label: 'Online', dot: 'bg-emerald-500 animate-pulse' };
  }
  return { label: 'Offline', dot: 'bg-amber-500' };
}

export function AgentManagement({ agents = [], performances: rawPerformances = [], onRefresh, onAuditAgent, readOnly = false }) {
  const { t } = useTranslation();
  const performances = Array.isArray(rawPerformances) ? rawPerformances : [];
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', telephone: '', role: 'agent', mot_de_passe: '', centre: ''
  });
  const [centres, setCentres] = useState([]);
  const [filterRole, setFilterRole] = useState('');
  const [filterCentre, setFilterCentre] = useState('');

  useEffect(() => {
    if (!readOnly) {
      api.get('/centres/').then(res => setCentres(res.data)).catch(() => {});
    }
  }, [readOnly]);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ── Edit modal state ──
  const [editModal, setEditModal] = useState(null); // agent object or null
  const [editData, setEditData] = useState({});
  const [editError, setEditError] = useState('');
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Validation helpers ──
  const validateName = (val) => /^[A-Za-zÀ-ÿ\s\-']+$/.test(val);
  const validatePhone = (val) => /^0[0-9]{9}$/.test(val);

  const validateForm = () => {
    const errors = {};
    if (!formData.prenom.trim()) {
      errors.prenom = 'Prénom requis';
    } else if (!validateName(formData.prenom.trim())) {
      errors.prenom = 'Lettres uniquement (pas de chiffres)';
    }
    if (!formData.nom.trim()) {
      errors.nom = 'Nom requis';
    } else if (!validateName(formData.nom.trim())) {
      errors.nom = 'Lettres uniquement (pas de chiffres)';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email requis';
    }
    if (!formData.telephone.trim()) {
      errors.telephone = 'Téléphone requis';
    } else if (!validatePhone(formData.telephone.trim())) {
      errors.telephone = '10 chiffres, commence par 0';
    }
    if (!formData.mot_de_passe || formData.mot_de_passe.length < 8) {
      errors.mot_de_passe = 'Minimum 8 caractères';
    }
    if (!formData.centre) {
      errors.centre = 'Centre requis';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await createAgent(formData);
      setShowModal(false);
      setFormData({ nom: '', prenom: '', email: '', telephone: '', role: 'agent', mot_de_passe: '' });
      setFieldErrors({});
      if (onRefresh) onRefresh();
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'object') {
        setFormError(Object.values(detail).flat().join(' '));
      } else {
        setFormError('Erreur lors de la création.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (agent) => {
    setEditModal(agent);
    setEditData({
      nom: agent.nom || '',
      prenom: agent.prenom || '',
      email: agent.email || '',
      telephone: agent.telephone || '',
      role: agent.role || 'agent',
      actif: agent.actif !== false,
    });
    setEditError('');
    setEditFieldErrors({});
    setConfirmDelete(false);
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editData.prenom.trim()) errors.prenom = 'Prénom requis';
    else if (!validateName(editData.prenom.trim())) errors.prenom = 'Lettres uniquement';
    if (!editData.nom.trim()) errors.nom = 'Nom requis';
    else if (!validateName(editData.nom.trim())) errors.nom = 'Lettres uniquement';
    if (!editData.email.trim()) errors.email = 'Email requis';
    if (editData.telephone && !validatePhone(editData.telephone.trim())) errors.telephone = '10 chiffres, commence par 0';
    setEditFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!validateEditForm()) return;
    setEditSubmitting(true);
    try {
      await updateAgent(editModal.id, editData);
      setEditModal(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'object') {
        setEditError(Object.values(detail).flat().join(' '));
      } else {
        setEditError('Erreur lors de la modification.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setEditSubmitting(true);
    try {
      await deleteAgent(editModal.id);
      setEditModal(null);
      setConfirmDelete(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Erreur lors de la suppression.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Merge performance data with agent data
  let agentsWithPerf = agents.map(agent => {
    const perf = performances.find(p => p.agent_id === String(agent.id));
    return { ...agent, perf };
  });

  // Apply client-side filters (for admin_it)
  if (filterRole) {
    agentsWithPerf = agentsWithPerf.filter(a => a.role === filterRole);
  }
  if (filterCentre) {
    agentsWithPerf = agentsWithPerf.filter(a => String(a.centre) === String(filterCentre));
  }

  return (
    <>
      <div className="space-y-6">
        {/* Add button */}
        {/* ── Filters (admin_it only) ── */}
        {!readOnly && (
        <div className="flex items-center gap-3 px-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white cursor-pointer focus:ring-2 focus:ring-[#0055A4]/30 focus:outline-none">
              <option value="">Tous les rôles</option>
              <option value="agent">Agent Support</option>
              <option value="agent_technique">Agent Technique</option>
              <option value="agent_annexe">Agent Annexe</option>
              <option value="admin">Manager</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select value={filterCentre} onChange={(e) => setFilterCentre(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white cursor-pointer focus:ring-2 focus:ring-[#0055A4]/30 focus:outline-none">
              <option value="">Tous les centres</option>
              {centres.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div className="ml-auto">
          <Button
            onClick={() => setShowModal(true)}
            className="rounded-xl font-black text-[10px] uppercase h-11 px-8 shadow-xl shadow-[#0055A4]/20 bg-[#0055A4] hover:bg-[#003d7a] text-white cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-2" /> {t('sidebar.experts')}
          </Button>
          </div>
        </div>
        )}

        {/* Table */}
        <Card className="rounded-[2rem] shadow-2xl bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 p-8 flex flex-row items-center gap-6">
            <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-100 text-[#0055A4]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('admin.agents_management')}</CardTitle>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-1">Supervision Qualité Live</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="pl-10 text-[11px] font-black uppercase h-16">Expert / ID</TableHead>
                  <TableHead className="text-[11px] font-black uppercase">{t('portal.status')}</TableHead>
                  <TableHead className="text-[11px] font-black uppercase">Charge (Real-time)</TableHead>

                  <TableHead className="pr-10 text-right text-[11px] font-black uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentsWithPerf.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-slate-400 font-bold uppercase text-[10px]">
                      {t('portal.no_tickets')}
                    </TableCell>
                  </TableRow>
                ) : (
                  agentsWithPerf.map((agent) => {
                    const roleInfo = ROLE_MAP[agent.role] || ROLE_MAP.agent;
                    const statusInfo = getStatusInfo(agent);
                    const workload = agent.perf ? Math.min(100, (agent.perf.tickets_actifs || 0) * 10) : 0;
                    const satisfaction = agent.perf?.satisfaction_moy;
                    return (
                      <TableRow key={agent.id} className="h-20 hover:bg-slate-50 transition-all group cursor-pointer">
                        <TableCell className="pl-10">
                          <div className="flex items-center gap-5">
                            <div className="bg-slate-100 p-3.5 rounded-2xl shadow-sm group-hover:bg-[#0055A4]/10 transition-colors">
                              <UserCircle className="w-7 h-7 text-slate-400 group-hover:text-[#0055A4] transition-colors" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-base uppercase tracking-tight leading-none mb-1">{agent.prenom} {agent.nom}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {agent.id.toString().slice(0, 8)} • {roleInfo.label}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", statusInfo.dot)}></div>
                            <span className="text-[11px] font-black uppercase text-slate-700">{statusInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-44 space-y-2">
                            <Progress value={workload} className="h-2.5 bg-slate-100" />
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex justify-end gap-2">
                            {onAuditAgent && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onAuditAgent(agent); }}
                              className="text-[11px] font-black uppercase text-[#0055A4] hover:bg-[#0055A4]/10 px-5 py-2 rounded-xl transition-colors cursor-pointer">
                              AUDIT <ChevronRight className="w-4 h-4 ml-2 inline" />
                            </button>
                            )}
                            {!readOnly && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditModal(agent); }}
                              className="text-slate-500 hover:bg-slate-100 hover:text-[#0055A4] rounded-xl p-2 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ─── CREATE MODAL ────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50 flex items-center gap-4">
              <div className="bg-[#0055A4]/10 p-3 rounded-xl">
                <UserPlus className="w-5 h-5 text-[#0055A4]" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[#0055A4]">{t('sidebar.experts')}</h3>
              </div>
              <button onClick={() => { setShowModal(false); setFormError(''); }} className="ml-auto p-2 rounded-xl hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Nom Complet</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input type="text" value={formData.prenom} placeholder="Prénom"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^A-Za-zÀ-ÿ\s\-']/g, '');
                        setFormData(prev => ({ ...prev, prenom: val }));
                        setFieldErrors(prev => ({ ...prev, prenom: undefined }));
                      }}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 ${fieldErrors.prenom ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`} />
                    {fieldErrors.prenom && <p className="text-[10px] font-bold text-red-500 mt-1">{fieldErrors.prenom}</p>}
                  </div>
                  <div>
                    <input type="text" value={formData.nom} placeholder="Nom"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^A-Za-zÀ-ÿ\s\-']/g, '');
                        setFormData(prev => ({ ...prev, nom: val }));
                        setFieldErrors(prev => ({ ...prev, nom: undefined }));
                      }}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 ${fieldErrors.nom ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`} />
                    {fieldErrors.nom && <p className="text-[10px] font-bold text-red-500 mt-1">{fieldErrors.nom}</p>}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Email AT</label>
                <input type="email" value={formData.email} placeholder="nom@at.dz"
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    setFieldErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 ${fieldErrors.email ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`} />
                {fieldErrors.email && <p className="text-[10px] font-bold text-red-500 mt-1">{fieldErrors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Téléphone</label>
                  <input type="tel" value={formData.telephone} placeholder="0770123456" maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setFormData(prev => ({ ...prev, telephone: val }));
                      setFieldErrors(prev => ({ ...prev, telephone: undefined }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 ${fieldErrors.telephone ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`} />
                  {fieldErrors.telephone && <p className="text-[10px] font-bold text-red-500 mt-1">{fieldErrors.telephone}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Rôle de l'Agent</label>
                  <select value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 bg-white cursor-pointer">
                    <option value="agent">Agent Support</option>
                    <option value="agent_technique">Agent Technique</option>
                    <option value="agent_annexe">Agent Annexe</option>
                    <option value="admin">Manager</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Centre de Distribution</label>
                <select value={formData.centre}
                  onChange={(e) => setFormData(prev => ({ ...prev, centre: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 bg-white cursor-pointer ${fieldErrors.centre ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`}>
                  <option value="">— Sélectionner un centre —</option>
                  {centres.map(c => <option key={c.id} value={c.id}>{c.code} — {c.nom}</option>)}
                </select>
                {fieldErrors.centre && <p className="text-[10px] font-bold text-red-500 mt-1">{fieldErrors.centre}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Mot de Passe</label>
                <input type="password" value={formData.mot_de_passe} placeholder="Minimum 8 caractères"
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, mot_de_passe: e.target.value }));
                    setFieldErrors(prev => ({ ...prev, mot_de_passe: undefined }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 ${fieldErrors.mot_de_passe ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`} />
                {fieldErrors.mot_de_passe && <p className="text-[10px] font-bold text-red-500 mt-1">{fieldErrors.mot_de_passe}</p>}
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-bold text-red-600">{formError}</div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 h-12 rounded-xl font-black text-xs uppercase text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
                  {t('common.cancel')}
                </button>
                <Button type="submit" disabled={submitting}
                  className="flex-1 h-12 rounded-xl font-black text-xs uppercase shadow-lg bg-[#0055A4] hover:bg-[#003d7a] text-white cursor-pointer">
                  {submitting ? '...' : t('common.confirm')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT MODAL ──────────────────────────────────────── */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8 border-b bg-slate-50/50 flex items-center gap-4">
              <div className="bg-[#0055A4]/10 p-3 rounded-xl">
                <Pencil className="w-5 h-5 text-[#0055A4]" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[#0055A4]">Modifier Agent</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editModal.prenom} {editModal.nom}</p>
              </div>
              <button onClick={() => setEditModal(null)} className="ml-auto p-2 rounded-xl hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-8 space-y-4">
              {/* Nom / Prénom */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Nom Complet</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input type="text" value={editData.prenom} placeholder="Prénom"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^A-Za-zÀ-ÿ\s\-']/g, '');
                        setEditData(prev => ({ ...prev, prenom: val }));
                        setEditFieldErrors(prev => ({ ...prev, prenom: undefined }));
                      }}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 ${editFieldErrors.prenom ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`} />
                    {editFieldErrors.prenom && <p className="text-[10px] font-bold text-red-500 mt-1">{editFieldErrors.prenom}</p>}
                  </div>
                  <div>
                    <input type="text" value={editData.nom} placeholder="Nom"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^A-Za-zÀ-ÿ\s\-']/g, '');
                        setEditData(prev => ({ ...prev, nom: val }));
                        setEditFieldErrors(prev => ({ ...prev, nom: undefined }));
                      }}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 ${editFieldErrors.nom ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`} />
                    {editFieldErrors.nom && <p className="text-[10px] font-bold text-red-500 mt-1">{editFieldErrors.nom}</p>}
                  </div>
                </div>
              </div>
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 block">Email</label>
                <input type="email" value={editData.email} placeholder="nom@at.dz"
                  onChange={(e) => {
                    setEditData(prev => ({ ...prev, email: e.target.value }));
                    setEditFieldErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 ${editFieldErrors.email ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`} />
                {editFieldErrors.email && <p className="text-[10px] font-bold text-red-500 mt-1">{editFieldErrors.email}</p>}
              </div>
              {/* Téléphone + Rôle */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Téléphone</label>
                  <input type="tel" value={editData.telephone} placeholder="0770123456" maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      setEditData(prev => ({ ...prev, telephone: val }));
                      setEditFieldErrors(prev => ({ ...prev, telephone: undefined }));
                    }}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 ${editFieldErrors.telephone ? 'border-red-400 bg-red-50/50' : 'border-slate-200'}`} />
                  {editFieldErrors.telephone && <p className="text-[10px] font-bold text-red-500 mt-1">{editFieldErrors.telephone}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 block">Rôle</label>
                  <select value={editData.role}
                    onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0055A4]/30 bg-white cursor-pointer">
                    <option value="agent">Agent Support</option>
                    <option value="agent_technique">Agent Technique National</option>
                    <option value="agent_annexe">Agent Annexe Régionale</option>
                  </select>
                </div>
              </div>
              {/* Toggle Actif/Inactif */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div>
                  <p className="text-sm font-black text-slate-700">Statut du compte</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{editData.actif ? 'L\'agent peut se connecter' : 'L\'agent ne peut plus se connecter'}</p>
                </div>
                <button type="button" onClick={() => setEditData(prev => ({ ...prev, actif: !prev.actif }))} className="cursor-pointer">
                  {editData.actif
                    ? <ToggleRight className="w-10 h-10 text-emerald-500" />
                    : <ToggleLeft className="w-10 h-10 text-slate-300" />
                  }
                </button>
              </div>

              {editError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-bold text-red-600">{editError}</div>
              )}

              {/* Buttons: Annuler / Enregistrer */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(null)}
                  className="flex-1 h-12 rounded-xl font-black text-xs uppercase text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
                  Annuler
                </button>
                <Button type="submit" disabled={editSubmitting}
                  className="flex-1 h-12 rounded-xl font-black text-xs uppercase shadow-lg bg-[#0055A4] hover:bg-[#003d7a] text-white cursor-pointer">
                  {editSubmitting ? '...' : 'Enregistrer'}
                </Button>
              </div>

              {/* ─── ZONE DANGER: SUPPRIMER ─── */}
              <div className="border-t border-red-100 pt-4 mt-4">
                {!confirmDelete ? (
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl font-black text-xs uppercase text-red-500 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" /> Supprimer cet agent
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      <p className="text-xs font-black uppercase">Voulez-vous vraiment supprimer {editModal.prenom} {editModal.nom} ?</p>
                    </div>
                    <p className="text-[10px] font-bold text-red-400">Cette action est irréversible. Tous les tickets de cet agent seront désassignés.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setConfirmDelete(false)}
                        className="flex-1 h-10 rounded-xl font-black text-[10px] uppercase text-slate-500 hover:bg-white border border-slate-200 transition-colors cursor-pointer">
                        Non, annuler
                      </button>
                      <button type="button" onClick={handleDelete} disabled={editSubmitting}
                        className="flex-1 h-10 rounded-xl font-black text-[10px] uppercase text-white bg-red-500 hover:bg-red-600 shadow-lg transition-colors cursor-pointer">
                        {editSubmitting ? '...' : 'Oui, supprimer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

