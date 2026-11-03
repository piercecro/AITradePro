import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Clock3, Headset, Loader2, Send, X } from 'lucide-react';

type SupportRequest = {
  id: string;
  message: string;
  status: string;
  created_at: string;
};

export const SupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const openSupport = () => setIsOpen(true);
    window.addEventListener('aitradepro:open-support', openSupport);
    return () => window.removeEventListener('aitradepro:open-support', openSupport);
  }, []);

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const textarea = messageRef.current;
    const trimmedMessage = textarea?.value.trim() ?? '';
    if (!trimmedMessage || submitting) {
      if (!trimmedMessage) {
        setError('Please enter a message before submitting.');
        textarea?.focus();
      }
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Please sign in again to send a support request.');

      const { data, error: insertError } = await supabase
        .from('support_requests')
        .insert({ user_id: authData.user.id, message: trimmedMessage })
        .select('id, message, status, created_at')
        .single();

      if (insertError) throw insertError;
      setRequest(data);
      if (textarea) textarea.value = '';
    } catch (submitError) {
      const messageText = submitError instanceof Error ? submitError.message : 'Could not send your request. Please try again.';
      setError(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  const startAnotherRequest = () => {
    setRequest(null);
    setError(null);
    if (messageRef.current) messageRef.current.value = '';
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open support"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-900/30 transition hover:scale-105 hover:bg-blue-700"
      >
        <Headset size={24} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-end bg-slate-950/30 p-4 sm:items-end sm:bg-transparent sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="support-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600"><Headset size={20} /></div>
                <div><h2 id="support-title" className="font-semibold">AITradePro Support</h2><p className="text-xs text-slate-300">Send a request to our support team</p></div>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close support" className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white"><X size={18} /></button>
            </header>

            {request ? (
              <div className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Clock3 size={28} /></div>
                <h3 className="text-center text-lg font-bold text-slate-900">Waiting for an agent</h3>
                <p className="mt-2 text-center text-sm text-slate-600">Your request has been submitted. A support agent will review it as soon as possible.</p>
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700"><Clock3 size={14} /> Pending</div>
                  <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{request.message}</p>
                  <p className="mt-3 text-xs text-slate-400">Submitted {new Date(request.created_at).toLocaleString()}</p>
                </div>
                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={startAnotherRequest} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">New request</button>
                  <button type="button" onClick={() => setIsOpen(false)} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="p-5">
                <label htmlFor="support-request" className="mb-2 block text-sm font-semibold text-slate-700">How can we help?</label>
                <textarea
                  ref={messageRef}
                  id="support-request"
                  maxLength={5000}
                  rows={6}
                  required
                  placeholder="Describe your question or issue..."
                  className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <><Loader2 size={17} className="animate-spin" />Submitting...</> : <><Send size={16} />Submit request</>}
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400"><CheckCircle size={13} /> Your message is sent securely to support.</p>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
};
