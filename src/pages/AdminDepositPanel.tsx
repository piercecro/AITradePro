import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  user_email?: string;
}

export const AdminDepositPanel = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch deposits with user emails
  const fetchDeposits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('deposits')
      .select(`
        id,
        user_id,
        amount,
        payment_method,
        status,
        created_at,
        user_profiles ( email )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deposits:', error);
      setLoading(false);
      return;
    }

    // Flatten user email from nested object
    const formatted = data.map((d: any) => ({
      ...d,
      user_email: d.user_profiles?.email || 'Unknown',
    }));

    setDeposits(formatted);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // Handle status updates (trigger fires automatically)
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('deposits')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      alert(`Deposit marked as ${newStatus.toUpperCase()}.`);
      fetchDeposits(); // refresh list
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'pending':
        return <Clock size={20} className="text-yellow-500" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <Clock size={20} className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);

  return (
    <div className="min-h-screen bg-[#0a0c10] pl-16 pt-16">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-3xl font-bold">Admin Deposit Panel</h1>
          <button
            onClick={fetchDeposits}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <RefreshCcw size={18} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="bg-[#13151f] rounded-xl p-6 border border-gray-800">
          {loading ? (
            <div className="text-center text-gray-400">Loading deposits...</div>
          ) : deposits.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No deposits found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-gray-300">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4">User Email</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit) => (
                    <tr
                      key={deposit.id}
                      className="border-b border-gray-800 hover:bg-[#1a1d29]"
                    >
                      <td className="py-3 px-4">{deposit.user_email}</td>
                      <td className="py-3 px-4">{formatCurrency(deposit.amount)}</td>
                      <td className="py-3 px-4">{deposit.payment_method}</td>
                      <td className="py-3 px-4 flex items-center space-x-2">
                        {getStatusIcon(deposit.status)}
                        <span
                          className={`${
                            deposit.status === 'confirmed'
                              ? 'text-green-500'
                              : deposit.status === 'pending'
                              ? 'text-yellow-500'
                              : 'text-red-500'
                          } font-medium capitalize`}
                        >
                          {deposit.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{formatDate(deposit.created_at)}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {deposit.status === 'pending' && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(deposit.id, 'confirmed')
                              }
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(deposit.id, 'rejected')
                              }
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {deposit.status !== 'pending' && (
                          <span className="text-gray-500 text-xs">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
