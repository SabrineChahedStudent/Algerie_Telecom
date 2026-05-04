import React, { useState, useEffect } from 'react';
import { getDemandesIT, traiterDemandeIT } from '@/api/demandes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Loader2, AlertTriangle, ThumbsUp, ThumbsDown, Filter } from 'lucide-react';

const STATUT_CONFIG = {
  en_attente:  { label: 'En attente',  color: 'bg-amber-100 text-amber-800',     icon: Clock },
  approuvee:   { label: 'Approuvée',   color: 'bg-blue-100 text-blue-800',       icon: Clock },
  refusee:     { label: 'Refusée',     color: 'bg-red-100 text-red-800',         icon: XCircle },
  traitee:     { label: 'Traitée',     color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  refusee_it:  { label: 'Refusée IT',  color: 'bg-rose-100 text-rose-800',       icon: XCircle },
};

const PRIORITE_COLORS = {
  basse: 'text-slate-400',
  normale: 'text-blue-500',
  haute: 'text-orange-500',
  urgente: 'text-red-600 font-black',
};

export function DemandesIT() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('approuvee');
  const [actionId, setActionId] = useState(null);
  const [commentaire, setCommentaire] = useState('');

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const data = await getDemandesIT(filter);
      setDemandes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDemandes(); }, [filter]);

  const handleAction = async (id, action) => {
    try {
      await traiterDemandeIT(id, { action, commentaire });
      setActionId(null);
      setCommentaire('');
      fetchDemandes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Demandes Reçues</h2>
        <div className="flex gap-2">
          {[
            { value: 'approuvee', label: 'À traiter' },
            { value: 'traitee', label: 'Traitées' },
            { value: 'all', label: 'Toutes' },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'outline'}
              onClick={() => setFilter(f.value)}
              className={`text-[10px] font-black uppercase rounded-xl px-4 cursor-pointer ${filter === f.value ? 'bg-[#0055A4] text-white' : ''}`}
            >
              <Filter className="w-3 h-3 mr-1" /> {f.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-[#0055A4]" /></div>
      ) : demandes.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-xl border p-16 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-400">Aucune demande {filter === 'approuvee' ? 'à traiter' : ''} pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {demandes.map((d) => {
            const cfg = STATUT_CONFIG[d.statut] || STATUT_CONFIG.approuvee;
            const Icon = cfg.icon;
            return (
              <Card key={d.id} className={`rounded-2xl shadow-md border ${d.statut === 'approuvee' ? 'border-blue-200' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${cfg.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-black text-sm text-slate-900">{d.sujet}</h3>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        <span className={`text-[9px] font-black uppercase ${PRIORITE_COLORS[d.priorite] || ''}`}>{d.priorite_label}</span>
                        {d.centre_nom && <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">📍 {d.centre_nom}</span>}
                      </div>
                      <p className="text-xs text-slate-500 mb-1">{d.description}</p>
                      {d.reponse_admin && <p className="text-xs text-blue-600 font-semibold">💬 Admin : {d.reponse_admin}</p>}
                      {d.reponse_it && <p className="text-xs text-emerald-600 mt-1 font-semibold">💻 IT : {d.reponse_it}</p>}
                      <p className="text-[10px] text-slate-300 mt-2 font-bold">
                        Par {d.demandeur_nom} — {new Date(d.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {d.statut === 'approuvee' && (
                      <div className="flex gap-2 shrink-0">
                        {actionId === d.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Réponse..." rows={2} className="border rounded-lg p-2 text-xs w-52 resize-none" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleAction(d.id, 'traiter')} className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg">
                                <ThumbsUp className="w-3 h-3 mr-1" /> Traiter
                              </Button>
                              <Button size="sm" onClick={() => handleAction(d.id, 'refuser')} className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg">
                                <ThumbsDown className="w-3 h-3 mr-1" /> Refuser
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setActionId(d.id)} className="text-[10px] font-bold rounded-lg cursor-pointer">
                            Répondre
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
