import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, AlertCircle, FileText, Tag, Paperclip, Eye, X, Loader2, Calendar, Trash2, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/api/axios';
import { deleteTicket } from '@/api/tickets';

export function CustomerChatDrawer({ ticket, messages = [], onClose, onSendMessage, onTicketDeleted }) {
  const [replyText, setReplyText] = useState('');
  const { t } = useTranslation();
  const [previewFile, setPreviewFile] = useState(null); // { blobUrl, nom, type_mime }
  const [loadingPreview, setLoadingPreview] = useState(false);
  const messagesEndRef = useRef(null);

  // Focus and scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, ticket]);

  const handleSend = () => {
    if (!replyText.trim()) return;
    onSendMessage(replyText);
    setReplyText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Fetch file via authenticated axios and create a blob URL for preview
  const handlePreview = async (pj) => {
    setLoadingPreview(true);
    try {
      const response = await api.get(`/tickets/pieces-jointes/${pj.id}/download/`, {
        responseType: 'blob',
      });
      const blobUrl = URL.createObjectURL(response.data);
      setPreviewFile({ blobUrl, nom: pj.nom_fichier, type_mime: pj.type_mime });
    } catch (err) {
      console.error('Failed to load attachment:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewFile?.blobUrl) URL.revokeObjectURL(previewFile.blobUrl);
    setPreviewFile(null);
  };

  const ticketRef = ticket?.numero_ticket || (ticket?.id ? `REQ-${String(ticket.id).padStart(3, '0')}` : '');
  const isClosed = ticket?.statut === 'resolu' || ticket?.statut === 'ferme';

  // Extract type service name (from TicketDetailSerializer, type_service is nested)
  const typeName = ticket?.type_service?.libelle || ticket?.type_service_libelle || '';

  // Extract pieces jointes
  const piecesJointes = ticket?.pieces_jointes || [];

  return (
    <>
    <Sheet open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-[100vw] sm:w-[90vw] md:max-w-[500px] p-0 flex flex-col h-full bg-slate-50 border-none shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-6 bg-[#0055A4] text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl shadow-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-2xl font-black text-white uppercase tracking-tighter">
                Ticket {ticketRef}
              </SheetTitle>
              <SheetDescription className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">
                {t('chat.title')} — {t('login.brand')}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-5">

            {/* ─── Ticket Info Card: Type + Description + Pièces Jointes ─── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Type de service */}
              {typeName && (
                <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                  <Tag className="w-4 h-4 text-[#0055A4]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('ticket_form.service_label')}</span>
                  <Badge className="ml-auto bg-[#0055A4]/10 text-[#0055A4] text-[10px] font-black uppercase px-3 py-1 rounded-full border-none shadow-none">
                    {typeName}
                  </Badge>
                </div>
              )}

              {/* Date de création */}
              {ticket?.created_at && (
                <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                  <Calendar className="w-4 h-4 text-[#0055A4]" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('portal.created_at')}</span>
                  <span className="ml-auto text-[11px] font-bold text-slate-700">
                    {new Date(ticket.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              {/* Bouton supprimer si ticket soumis */}
              {ticket?.statut === 'soumis' && (
                <div className="px-5 py-3 border-b border-slate-100">
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) return;
                      try {
                        await deleteTicket(ticket.id);
                        onClose();
                        if (onTicketDeleted) onTicketDeleted();
                      } catch (err) {
                        alert(err.response?.data?.error || 'Erreur lors de la suppression.');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider hover:bg-red-100 transition-colors cursor-pointer border border-red-100"
                  >
                    <Trash2 className="w-4 h-4" /> {t('common.delete')}
                  </button>
                </div>
              )}

              {/* Pièces jointes */}
              {piecesJointes.length > 0 && (
                <div className="px-5 py-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5" /> {t('chat.attachment')} ({piecesJointes.length})
                  </p>
                  <div className="space-y-2">
                    {piecesJointes.map((pj) => {
                      const downloadUrl = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/tickets/pieces-jointes/${pj.id}/download/`;
                      const isImage = pj.type_mime?.startsWith('image/');
                      return (
                        <button
                          key={pj.id}
                          type="button"
                          onClick={() => handlePreview(pj)}
                          className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 hover:bg-[#0055A4]/5 hover:border-[#0055A4]/30 transition-colors cursor-pointer w-full text-left"
                        >
                          <div className="bg-[#0055A4]/10 p-2 rounded-lg">
                            {isImage ? <Paperclip className="w-4 h-4 text-[#0055A4]" /> : <FileText className="w-4 h-4 text-[#0055A4]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#0055A4] truncate underline">{pj.nom_fichier}</p>
                            <p className="text-[9px] text-slate-400 uppercase">
                              {pj.type_mime} • {Math.round((pj.taille_octets || 0) / 1024)} Ko
                            </p>
                          </div>
                          <Eye className="w-4 h-4 text-[#0055A4] shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ─── First message: Description as initial message ─── */}
            {ticket?.description && (
              <div className="flex justify-end">
                <div className="max-w-[85%] p-5 rounded-3xl rounded-tr-none text-sm shadow-lg bg-[#0055A4] text-white text-left">
                  <p className="font-bold leading-relaxed">{ticket.description}</p>
                  <p className="text-[9px] mt-3 font-black uppercase opacity-60 text-white">
                    Vous • {ticket.created_at ? new Date(ticket.created_at).toLocaleString('fr-FR') : ''}
                  </p>
                </div>
              </div>
            )}

            {/* ─── AI Summary ─── */}
            {ticket?.resume_ia && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-5 rounded-3xl rounded-tl-none text-sm shadow-lg bg-purple-50 border border-purple-100 text-slate-800 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-4 h-4 text-purple-600" />
                    <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest">Résumé IA (Triage Initial)</p>
                  </div>
                  <p className="font-bold leading-relaxed whitespace-pre-wrap">{ticket.resume_ia}</p>
                  <p className="text-[9px] mt-3 font-black uppercase opacity-60 text-slate-400">
                    Système
                  </p>
                </div>
              </div>
            )}

            {/* ─── Chat messages ─── */}
            <div className="space-y-4">
              {messages.map((m, idx) => {
                const isCustomer = m.expediteur_role === 'client' || m.sender === 'customer';
                const senderLabel = isCustomer ? 'Vous' : 'Expert AT';
                const dateStr = m.date_envoi
                  ? new Date(m.date_envoi).toLocaleString('fr-FR')
                  : m.date || '';

                return (
                  <div key={m.id || idx} className={cn("flex", isCustomer ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      "max-w-[85%] p-5 rounded-3xl text-sm shadow-lg text-left",
                      isCustomer
                        ? 'bg-[#0055A4] text-white rounded-tr-none'
                        : 'bg-white border text-slate-800 rounded-tl-none'
                    )}>
                      <p className="font-bold leading-relaxed">{m.contenu || m.text}</p>
                      <p className={cn(
                        "text-[9px] mt-3 font-black uppercase opacity-60",
                        isCustomer ? 'text-white' : 'text-slate-400'
                      )}>
                        {senderLabel} • {dateStr}
                      </p>
                    </div>
                  </div>
                );
              })}

              {messages.length === 0 && !ticket?.description && (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                    {t('chat.no_messages')}
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

          </div>
        </ScrollArea>

        {/* Input area */}
        {!isClosed ? (
          <div className="p-6 border-t bg-white shrink-0">
            <div className="flex gap-4">
              <Textarea
                placeholder={t('chat.placeholder')}
                className="min-h-[80px] rounded-2xl border-slate-200 bg-slate-50/50"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                className="h-auto w-16 bg-[#0055A4] rounded-2xl text-white"
                onClick={handleSend}
                disabled={!replyText.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 border-t bg-slate-100 flex items-center justify-center gap-3 shrink-0">
            <AlertCircle className="w-5 h-5 text-slate-400" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Réclamation clôturée. Messagerie désactivée.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>

    {/* ─── Loading overlay ─── */}
    {loadingPreview && (
      <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
          <Loader2 className="w-8 h-8 text-[#0055A4] animate-spin" />
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Chargement du fichier...</p>
        </div>
      </div>
    )}

    {/* ─── Preview Modal ─── */}
    {previewFile && (
      <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center" onClick={closePreview}>
        {/* Header bar */}
        <div className="w-full max-w-4xl flex items-center justify-between px-6 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-white" />
            <p className="text-white font-bold text-sm truncate max-w-md">{previewFile.nom}</p>
          </div>
          <button onClick={closePreview} className="text-white hover:text-red-400 transition-colors cursor-pointer bg-white/10 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="w-full max-w-4xl max-h-[80vh] flex-1 flex items-center justify-center px-6 pb-6" onClick={(e) => e.stopPropagation()}>
          {previewFile.type_mime?.startsWith('image/') ? (
            <img
              src={previewFile.blobUrl}
              alt={previewFile.nom}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
          ) : previewFile.type_mime === 'application/pdf' ? (
            <iframe
              src={previewFile.blobUrl}
              title={previewFile.nom}
              className="w-full h-[75vh] rounded-2xl shadow-2xl bg-white"
            />
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-700">{previewFile.nom}</p>
              <p className="text-xs text-slate-400 mt-2">Aperçu non disponible pour ce type de fichier</p>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
