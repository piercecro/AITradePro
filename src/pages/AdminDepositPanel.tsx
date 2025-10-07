import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export const AdminDepositPanel = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeposits();
  }, []);

  const loadDeposits = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error loading deposits:", error);
    setDeposits(data || []);
    setLoading(false);
  };

  const confirmDeposit = async (id: number) => {
    const { error } = await supabase.rpc("confirm_deposit", { deposit_id: id });
    if (error) {
      alert("Error confirming deposit: " + error.message);
    } else {
      alert("✅ Deposit confirmed successfully!");
      loadDeposits();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-white flex items-center justify-center">
        <p>Loading deposits...</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#0a0c10] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Admin Deposit Panel</h1>

      {deposits.length === 0 ? (
        <div className="text-gray-500 text-center mt-12">
          No deposits found.
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map((d) => (
            <div
              key={d.id}
              className="p-4 bg-[#1a1d29] rounded-lg border border-gray-700"
            >
              <div className="flex justify-between mb-2">
                <div>
                  <div className="font-semibold">${d.amount}</div>
                  <div className="text-sm text-gray-400">
                    {d.payment_method}
                  </div>
                  <div className="text-xs text-gray-500">{d.created_at}</div>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      d.status === "confirmed"
                        ? "bg-green-600/20 text-green-400"
                        : "bg-yellow-600/20 text-yellow-400"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
              </div>
              {d.status !== "confirmed" && (
                <button
                  onClick={() => confirmDeposit(d.id)}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm"
                >
                  Confirm Deposit
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
