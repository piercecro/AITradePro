import { useState, useEffect } from 'react';
import { Copy, Users, DollarSign, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const ReferralPage = () => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const referralCode = user?.id?.substring(0, 8).toUpperCase() || '';
  const referralLink = `https://aitradepro.com/ref/${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] pl-16 pt-16">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-white text-3xl font-bold mb-8">Referral Program</h1>

        <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-8 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Share2 size={32} className="text-white" />
            <h2 className="text-white text-2xl font-bold">Earn 10% Commission</h2>
          </div>
          <p className="text-blue-100 mb-6">
            Invite your friends and earn 10% of their trading fees for life. The more you refer, the more you earn!
          </p>
        </div>

        <div className="bg-[#13151f] rounded-xl p-8 border border-gray-800 mb-6">
          <h3 className="text-white text-xl font-semibold mb-4">Your Referral Link</h3>

          <div className="flex items-center space-x-3 mb-4">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-[#1a1d29] text-white rounded-lg px-4 py-3 border border-gray-700"
            />
            <button
              onClick={handleCopy}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Copy size={20} />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          <div className="text-gray-400 text-sm">
            Share this link with your friends to start earning commissions
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Referrals</span>
              <Users size={20} className="text-blue-500" />
            </div>
            <div className="text-white text-3xl font-bold">0</div>
          </div>

          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total Earned</span>
              <DollarSign size={20} className="text-green-500" />
            </div>
            <div className="text-white text-3xl font-bold">$0.00</div>
          </div>

          <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">This Month</span>
              <TrendingUp size={20} className="text-cyan-500" />
            </div>
            <div className="text-white text-3xl font-bold">$0.00</div>
          </div>
        </div>

        <div className="bg-[#13151f] rounded-xl p-8 border border-gray-800">
          <h3 className="text-white text-xl font-semibold mb-6">How It Works</h3>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <div className="text-white font-semibold mb-1">Share Your Link</div>
                <div className="text-gray-400 text-sm">
                  Share your unique referral link with friends and family
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <div className="text-white font-semibold mb-1">They Sign Up</div>
                <div className="text-gray-400 text-sm">
                  Your referrals create an account and start trading
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <div className="text-white font-semibold mb-1">You Earn Commission</div>
                <div className="text-gray-400 text-sm">
                  Earn 10% of their trading fees automatically deposited to your account
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendingUp = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
