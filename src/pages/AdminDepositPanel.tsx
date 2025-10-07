// src/pages/AdminDepositPanel.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  user_profiles?: {
    username: string;
    email: string;
  };
}

export const AdminDepositPanel = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDeposits();
  }, []);

  // ✅ Load all deposits
  const loadDeposits = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching deposits...");

      let { data, error } = await supabase
        .from("deposits")
        .select("*, user_profiles(username, email)")
        .order("created_at", { ascending: false });

      if (error && error.message.includes("relationship")) {
        console.warn("⚠️ Relationship not found, using fallback query.");
        const { data: rawDeposits, error: fallbackError } = await supabase
          .from("deposits")
          .select("*")
          .order("created_at", { ascending: false });

        if (fallbackError) throw fallbackError;

        // fetch users manually
        const withUsers = await Promise.all(
          (rawDeposits || []).map(async (dep) => {
            const { data: userProfile } = await supabase
              .from("user_profiles")
              .select("username, email")
              .eq("id", dep.user_id)
              .maybeSingle();
            return { ...dep, user_profiles: userProfile };
          })
        );

        data = withUsers;
      } else if (error) {
        throw error;
      }

      console.log("✅ Deposits fetched:", data);
      setDeposits(data || []);
    } catch (err: any) {
      console.error("❌ Error loading deposits:", err.message);
      alert("Error loading deposits: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Confirm deposit and update user balance
  const handleConfirmDeposit = async (deposit: Deposit) => {
    const confirmAction = window.confirm(
      `Confirm deposit of $${deposit.amount}?`
    );
    if (!confirmAction) return;

    setActionLoading(deposit.id);

    try {
      // 1️⃣ Update deposit status
      const { error: depositError } = await supabase
        .from("deposits")
        .update({ status: "confirmed" })
        .eq("id", deposit.id);

      if (depositError)
        throw new Error("Deposit update failed: " + depositError.message);

      // 2️⃣ Run RPC to update user balances
      const { data, error: rpcError } = await supabase.rpc(
        "update_user_balance_after_deposit",
        {
          user_id_input: deposit.user_id,
          deposit_amount: deposit.amount,
        }
      );

      if (rpcError) {
        console.error("RPC ERROR:", rpcError);
        throw new Error("RPC failed: " + rpcError.message);
      }

      console.log("RPC success result:", data);
      alert(
        `✅ Deposit confirmed for ${
          deposit.user_profiles?.email || deposit.user_id
        } ($${deposit.amount})`
      );

      loadDeposits();
    } catch (err: any) {
      console.error("❌ Confirm deposit error:", err);
      alert("Error confirming deposit: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ❌ Reject deposit
  const handleRejectDeposit = async (deposit: Deposit) => {
    const rejectAction = window.confirm(
      `Reject deposit of $${deposit.amount}?`
    );
    if (!rejectAction) return;

    setActionLoading(deposit.id);

    try {
      const { error } = await supabase
        .from("deposits")
        .update({ status: "rejected" })
        .eq("id", deposit.id);

      if (error) throw new Error(error.message);

      alert(`❌ Deposit rejected for ${deposit.user_profiles?.email || "User"}`);
      loadDeposits();
    } catch (err: any) {
      console.error("❌ Error rejecting deposit:", err.message);
      alert("Error rejecting deposit: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <Loader2 size={32} className="text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] pl-16 pt-16">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-white text-3xl font-bold mb-8">
          Admin Deposit Panel
        </h1>

        {deposits.length === 0 ? (
          <div className="text-gray-400 text-center py-12">
            No deposits found.
          </div>
        ) : (
          <div className="space-y-4">
            {deposits.map((deposit) => (
              <div
                key={deposit.id}
                className="bg-[#13151f] p-6 rounded-xl border border-gray-800 flex justify-between items-center"
              >
                <div>
                  <div className="text-white font-semibold">
                    {deposit.user_profiles?.username || "User"}{" "}
                    <span className="text-gray-400 text-sm">
                      ({deposit.user_profiles?.email || deposit.user_id})
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    Amount:{" "}
                    <span className="text-green-400 font-semibold">
                      ${deposit.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm">
                    Method: {deposit.payment_method}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {new Date(deposit.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`px-3 py-1 text-xs rounded-full capitalize font-semibold ${
                      deposit.status === "pending"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : deposit.status === "confirmed"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {deposit.status}
                  </span>

                  {deposit.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleConfirmDeposit(deposit)}
                        disabled={actionLoading === deposit.id}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        title="Confirm"
                      >
                        {actionLoading === deposit.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <CheckCircle size={18} />
                        )}
                      </button>

                      <button
                        onClick={() => handleRejectDeposit(deposit)}
                        disabled={actionLoading === deposit.id}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        title="Reject"
                      >
                        {actionLoading === deposit.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <XCircle size={18} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
