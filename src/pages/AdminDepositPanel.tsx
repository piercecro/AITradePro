import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const AdminDepositPanel = () => {
  const [deposits, setDeposits] = useState<any[]>([]);

  useEffect(() => {
    loadDeposits();
  }, []);

  const loadDeposits = async () => {
    const { data, error } = await supabase.from("deposits").select("*");
    if (error) console.error("Error loading deposits:", error);
    else setDeposits(data || []);
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase
      .from("deposits")
      .update({ status })
      .eq("id", id);

    if (error) console.error("Error updating status:", error);
    else loadDeposits();
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] pl-16 pt-16 p-6 text-white">
      <h1 className="text-3xl font-bold mb-8">Admin Deposit Panel</h1>

      {deposits.length === 0 ? (
        <div className="text-gray-400">No deposits yet</div>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <div
              key={deposit.id}
              className="p-4 bg-[#13151f] rounded-lg border border-gray-800"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{deposit.user_id}</div>
                  <div className="text-sm text-gray-400">
                    {deposit.amount} USD — {deposit.payment_method}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(deposit.created_at).toLocaleString()}
                  </div>
                </div>

                <div>
                  <select
                    value={deposit.status}
                    onChange={(e) =>
                      handleStatusChange(deposit.id, e.target.value)
                    }
                    className="bg-[#1a1d29] border border-gray-700 text-white rounded-lg px-3 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
