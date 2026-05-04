import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageButton } from '@/components/shared/LanguageButton';
import { getServiceTypes, createTicket, uploadAttachment } from '@/api/tickets';
import { Loader2, Phone, Search, CheckCircle2, FileUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupportChatbot } from '@/components/features/portal/SupportChatbot';

export function NewTicketForm({ userPhone, onSubmit }) {
  const { t } = useTranslation();
  const [serviceTypes, setServiceTypes] = useState([]);
  const [typeService, setTypeService] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachment, setAttachment] = useState(null); // File object
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [error, setError] = useState('');

  // Chatbot Interception States
  const [showChatbot, setShowChatbot] = useState(false);
  const [pendingTicketData, setPendingTicketData] = useState(null);
  const [successTicket, setSuccessTicket] = useState(null);

  // Fetch service types from backend
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await getServiceTypes();
        let svcs = data.results || data;
        if (!svcs || svcs.length === 0) {
          throw new Error('Empty services');
        }
        setServiceTypes(svcs);
      } catch (err) {
        console.error('Failed to fetch service types:', err);
        // Fallback types
        setServiceTypes([
          { id: 1, libelle: 'Internet ADSL' },
          { id: 2, libelle: 'Internet Fiber' },
          { id: 3, libelle: 'Téléphonie Fixe' },
          { id: 4, libelle: '4G LTE' },
          { id: 5, libelle: 'IPTV' },
          { id: 6, libelle: 'Autre' },
        ]);
      }
    };
    fetchTypes();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      const reader = new FileReader();
      reader.onloadend = () => setAttachmentPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!typeService || !description) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    // Intercept with Chatbot
    const tServiceName = serviceTypes.find(s => s.id === parseInt(typeService))?.libelle || '';
    setPendingTicketData({
      type_service: parseInt(typeService),
      typeServiceName: tServiceName,
      titre: titre || description.substring(0, 50),
      description,
    });
    setShowChatbot(true);
  };

  const executeFinalSubmission = async (aiHistory) => {
    setShowChatbot(false);
    setIsSubmitting(true);
    setError('');

    try {
      // Send AI history as a separate field for the backend to summarize
      const ticketData = {
        ...pendingTicketData
      };
      
      if (aiHistory && aiHistory.length > 0) {
        ticketData.historique_ia = aiHistory.map(m => `${m.role === 'bot' ? 'Assistant' : 'Client'}: ${m.text}`).join('\n');
      }

      const newTicket = await createTicket(ticketData);

      // Upload attachment if present
      if (attachment && newTicket.id) {
        try {
          await uploadAttachment(newTicket.id, attachment);
        } catch (uploadErr) {
          console.error('Attachment upload failed:', uploadErr);
        }
      }

      // Reset form
      setTypeService('');
      setTitre('');
      setDescription('');
      setAttachment(null);
      setAttachmentPreview(null);
      setPendingTicketData(null);

      // Show success modal instead of immediately switching tabs
      setSuccessTicket(newTicket);
    } catch (err) {
      console.error('Ticket creation failed:', err, err.response?.data);
      let errorMsg = 'Erreur lors de la soumission.';
      if (err.response?.data) {
        if (err.response.data.detail) errorMsg = err.response.data.detail;
        else if (err.response.data.message) errorMsg = err.response.data.message;
        else if (typeof err.response.data === 'object') {
          // Flatten DRF errors (e.g. {"description": ["This field is required."]})
          const errors = Object.entries(err.response.data).map(([key, val]) => {
            const valStr = Array.isArray(val) ? val.join(' ') : String(val);
            return `${key}: ${valStr}`;
          });
          if (errors.length > 0) errorMsg = errors.join(' | ');
        }
      }
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl border shadow-xl">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Service Type Select */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500">{t('ticket_form.service_label')}</Label>
              <Select onValueChange={setTypeService} required>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold">
                  <SelectValue placeholder={t('ticket_form.service_label')} />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl">
                  {serviceTypes.map(t => (
                    <SelectItem key={t.id} value={String(t.id)} label={t.libelle} className="font-bold text-xs uppercase">
                      {t.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone info card */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
              <div className="bg-white p-2 rounded-full shadow-md text-[#0055A4]">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400">Ligne AT</Label>
                <p className="text-sm font-black text-slate-700 tracking-tight">{userPhone}</p>
              </div>
            </div>
          </div>

          {/* Location card */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm relative">
            <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
              <Search className="w-3.5 h-3.5" /> {t('portal.service')}
            </Label>
            <div className="mt-3">
              <p className="text-base font-black text-slate-900 leading-none">Algérie Télécom — Zone Client</p>
              <p className="text-base font-black text-slate-900 leading-none">{t('portal.at_zone')}</p>
              <p className="text-[11px] font-black text-[#0055A4] uppercase mt-1">{t('portal.auto_detection')}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500">{t('ticket_form.description_label')}</Label>
            <Textarea
              className="min-h-[140px] rounded-xl font-medium"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('ticket_form.description_label')}
              required
            />
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase text-slate-500">{t('ticket_form.attachment_label')}</Label>
            <div className="flex items-center gap-4">
              <label className="flex-1 border-2 border-dashed border-slate-200 rounded-xl p-4 hover:bg-slate-50 cursor-pointer transition-colors">
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                <div className="flex items-center gap-3">
                  <FileUp className="w-5 h-5 text-slate-400" />
                  <p className="text-xs font-black text-slate-600 uppercase">{t('ticket_form.attachment_label')}</p>
                </div>
              </label>
              {attachmentPreview && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border">
                  <img src={attachmentPreview} className="w-full h-full object-cover" alt="Preview" />
                  <button
                    type="button"
                    onClick={() => { setAttachment(null); setAttachmentPreview(null); }}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <LanguageButton
            label={t('ticket_form.submit')}
            arabicLabel="إرسال الطلب"
            className="w-full py-10 text-xl font-black bg-[#0055A4] text-white rounded-xl shadow-lg hover:bg-[#004080]"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="ml-2 h-6 w-6 animate-spin" />}
          </LanguageButton>
        </form>
      </div>

      {/* Right column — SLA */}
      <div className="space-y-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-4" />
          <h4 className="text-sm font-black text-emerald-800 uppercase">Engagement SLA</h4>
          <p className="text-[10px] text-emerald-600 mt-2 font-bold uppercase">Résolution sous 72h maximum.</p>
        </div>
      </div>

      {/* Hugging Face Interception Chatbot */}
      <SupportChatbot 
        isOpen={showChatbot} 
        ticketData={pendingTicketData} 
        onCancel={() => setShowChatbot(false)} 
        onForceSubmit={executeFinalSubmission} 
      />

      {/* Success Modal */}
      {successTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Succès !</h3>
            <p className="text-slate-600 mb-8 font-medium">
              Votre réclamation a été soumise avec succès sous la référence <br/>
              <strong className="text-slate-900">{successTicket.numero_ticket || '...'}</strong>.
            </p>
            <Button 
              onClick={() => onSubmit(successTicket)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl"
            >
              Voir mes réclamations
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
