import { useEffect, useState } from 'react';
import { Copy, Users, Share2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const ReferralPage = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [refereeCount, setRefereeCount] = useState<number | null>(null);
  const [errorText, setErrorText] = useState('');
  const referralLink = user ? `${window.location.origin}/?ref=${encodeURIComponent(user.id)}` : '';

  useEffect(() => {
    let active = true;
    const loadCount = async () => {
      if (!user) {
        setRefereeCount(0);
        return;
      }

      const { data, error } = await supabase.rpc('get_my_referral_count');
      if (!active) return;
      if (error) {
        console.error('Unable to load referral count:', error.message);
        setErrorText('Referral totals are temporarily unavailable.');
        setRefereeCount(null);
        return;
      }
      setRefereeCount(Number(data ?? 0));
    };

    void loadCount();
    return () => { active = false; };
  }, [user]);

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Could not copy referral link:', error);
      setErrorText('Could not copy the link. Please copy it from the field above.');
    }
  };

  return (
    <div className="min-h-screen bg-[#edf3f8] p-5 lg:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-800">Affiliation</h1>
          <p className="mt-2 text-slate-600">Share your personal link and keep track of users who join through it.</p>
        </header>

        <section className="rounded-2xl border border-[#dfe7f0] bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-3"><Share2 className="text-blue-600" size={26} /><h2 className="text-xl font-semibold text-slate-800">Your referral link</h2></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="referral-link" className="sr-only">Referral link</label>
            <input id="referral-link" value={referralLink} readOnly className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700" />
            <button type="button" onClick={handleCopy} disabled={!referralLink} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
              <Copy size={18} /><span>{copied ? 'Copied!' : 'Copy link'}</span>
            </button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><LinkIcon size={15} />New sign-ups using this link will be associated with your account.</p>
          {errorText && <p role="status" className="mt-3 text-sm text-rose-600">{errorText}</p>}
        </section>

        <section className="rounded-2xl border border-[#dfe7f0] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <div><h2 className="font-medium text-slate-500">Total referees</h2><p className="mt-2 text-4xl font-bold text-slate-800">{refereeCount === null ? '—' : refereeCount}</p></div>
            <div className="rounded-full bg-blue-50 p-4 text-blue-600"><Users size={28} /></div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#dfe7f0] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">How it works</h2>
          <ol className="list-inside list-decimal space-y-3 text-slate-600">
            <li>Copy and share your unique referral link.</li>
            <li>When a new user signs up using your link, they are counted as your referee.</li>
            <li>Your referee total updates from your account’s recorded referrals.</li>
          </ol>
        </section>
      </div>
    </div>
  );
};
