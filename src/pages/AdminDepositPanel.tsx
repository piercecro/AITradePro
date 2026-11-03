import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { CheckCircle, XCircle, Loader2, TrendingUp } from "lucide-react";

interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  username?: string;
  email?: string;
}

interface UserBalanceProfile {
  id: string;
  username?: string;
  email?: string;
  available_balance?: number | string | null;
  role?: string;
}

const formatCurrency = (value: number | string | null | undefined) => {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
};

export const AdminDepositPanel = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [users, setUsers] = useState<UserBalanceProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [balancePercentages, setBalancePercentages] = useState<Record<string, number>>({});
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null);

  useEffect(() => {
    void loadDeposits();
    void loadUsers();
  }, []);

  const loadDeposits = async () => {
    setLoading(true);
    try {
      console.log("🔄 Fetching deposits...");

      const { data, error } = await supabase
        .from("deposits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (dep) => {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("username, email")
            .eq("id", dep.user_id)
            .maybeSingle();

          return {
            ...dep,
            username: profile?.username || "Unknown User",
            email: profile?.email || "No Email",
          };
        })
      );

      console.log("✅ Deposits fetched:", enriched);
      setDeposits(enriched);
    } catch (err: any) {
      console.error("❌ Error loading deposits:", err.message);
      alert("Error loading deposits: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, username, email, available_balance, role")
        .order("username", { ascending: true, nullsFirst: false });

      if (error) throw error;

      const normalizedUsers = (data || []).map((user) => ({
        ...user,
        available_balance: Number(user.available_balance ?? 0),
      }));

      setUsers(normalizedUsers);
      setBalancePercentages((prev) => {
        const next = { ...prev };
        normalizedUsers.forEach((user) => {
          if (next[user.id] === undefined) next[user.id] = 10;
        });
        return next;
      });
    } catch (err: any) {
      console.error("❌ Error loading users:", err.message);
      alert("Error loading users: " + err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleConfirmDeposit = async (deposit: Deposit) => {
    if (!window.confirm(`Confirm deposit of $${deposit.amount}?`)) return;
    setActionLoading(deposit.id);

    try {
      const { error: rpcError } = await supabase.rpc(
        "confirm_deposit_and_credit_balance",
        { deposit_id_input: deposit.id }
      );

      if (rpcError) throw rpcError;

      alert(
        `✅ Deposit confirmed for ${deposit.email || "User"} ($${deposit.amount})`
      );
      await loadDeposits();
    } catch (err: any) {
      console.error("❌ Error confirming deposit:", err.message);
      alert("Error confirming deposit: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDeposit = async (deposit: Deposit) => {
    if (!window.confirm(`Reject deposit of $${deposit.amount}?`)) return;
    setActionLoading(deposit.id);

    try {
      const { error } = await supabase
        .from("deposits")
        .update({ status: "rejected" })
        .eq("id", deposit.id);

      if (error) throw error;

      alert(`❌ Deposit rejected for ${deposit.email || "User"}`);
      await loadDeposits();
    } catch (err: any) {
      console.error("❌ Error rejecting deposit:", err.message);
      alert("Error rejecting deposit: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdjustBalance = async (user: UserBalanceProfile) => {
    const percentage = balancePercentages[user.id] ?? 10;
    const currentBalance = Number(user.available_balance ?? 0);
    const increaseAmount = currentBalance * (percentage / 100);
    const newBalance = currentBalance + increaseAmount;
    const userLabel = user.username || user.email || "this user";

    if (!window.confirm(`Increase ${userLabel}'s balance by ${percentage}%?\nCurrent: ${formatCurrency(currentBalance)}\nIncrease: ${formatCurrency(increaseAmount)}\nNew total: ${formatCurrency(newBalance)}`)) {
      return;
    }

    setAdjustingUserId(user.id);

    try {
      const { data, error } = await supabase.rpc("increase_user_balance_by_percentage", {
        target_user_id: user.id,
        percentage,
      });

      if (error) throw error;

      const result = (data as Array<{ increase_amount?: number; new_balance?: number }> | null)?.[0];
      alert(
        `✅ Balance updated for ${userLabel}.\nIncrease: ${formatCurrency(result?.increase_amount ?? increaseAmount)}\nNew balance: ${formatCurrency(result?.new_balance ?? newBalance)}`
      );

      await loadUsers();
    } catch (err: any) {
      console.error("❌ Error adjusting user balance:", err.message);
      alert("Error adjusting user balance: " + err.message);
    } finally {
      setAdjustingUserId(null);
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
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="mb-8 text-3xl font-bold text-white">Admin Panel</h1>

        <section className="mb-10 rounded-2xl border border-gray-800 bg-[#13151f] p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Adjust User Balances</h2>
              <p className="text-sm text-gray-400">Set a percentage increase per user and confirm before applying.</p>
            </div>
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300">
              <TrendingUp size={20} />
            </div>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-300">
              <Loader2 size={24} className="animate-spin" />
              <span className="ml-3">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No user profiles found.</div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {users.map((user) => {
                const percentage = balancePercentages[user.id] ?? 10;
                const currentBalance = Number(user.available_balance ?? 0);
                const increaseAmount = Math.round(currentBalance * percentage) / 100;
                const newBalance = currentBalance + increaseAmount;

                return (
                  <div key={user.id} className="rounded-2xl border border-gray-700 bg-[#1a1d2a] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-white">{user.username || "Unnamed User"}</div>
                        <div className="text-sm text-gray-400">{user.email || user.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">Current</div>
                        <div className="text-lg font-bold text-cyan-400">{formatCurrency(currentBalance)}</div>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-sm text-gray-300">
                        <label htmlFor={`balance-percent-${user.id}`}>Increase by</label>
                        <span className="font-semibold text-white">{percentage}%</span>
                      </div>
                      <input
                        id={`balance-percent-${user.id}`}
                        type="range"
                        min={1}
                        max={100}
                        value={percentage}
                        onChange={(event) => {
                          const nextValue = Number(event.target.value);
                          setBalancePercentages((prev) => ({ ...prev, [user.id]: nextValue }));
                        }}
                        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-cyan-500"
                      />
                      <div className="mt-2 flex justify-between text-[11px] text-gray-500">
                        <span>1%</span><span>100%</span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#0f111b] p-3">
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">Increase</div>
                        <div className="mt-1 text-base font-semibold text-green-400">{formatCurrency(increaseAmount)}</div>
                      </div>
                      <div className="rounded-xl bg-[#0f111b] p-3">
                        <div className="text-[11px] uppercase tracking-wide text-gray-500">New total</div>
                        <div className="mt-1 text-base font-semibold text-white">{formatCurrency(newBalance)}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleAdjustBalance(user)}
                      disabled={adjustingUserId === user.id}
                      className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {adjustingUserId === user.id ? (
                        <><Loader2 size={18} className="mr-2 animate-spin" />Updating...</>
                      ) : "Confirm Increase"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-800 bg-[#13151f] p-6">
          <h2 className="mb-5 text-2xl font-semibold text-white">Deposit Requests</h2>
          {deposits.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No deposits found.</div>
          ) : (
            <div className="space-y-4">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="flex items-center justify-between gap-4 rounded-xl border border-gray-700 bg-[#1a1d2a] p-5">
                  <div>
                    <div className="font-semibold text-white">
                      {deposit.username} <span className="text-sm text-gray-400">({deposit.email || deposit.user_id})</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Amount: <span className="font-semibold text-green-400">${deposit.amount.toFixed(2)}</span>
                    </div>
                    <div className="text-sm text-gray-400">Method: {deposit.payment_method}</div>
                    <div className="text-xs text-gray-500">{new Date(deposit.created_at).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      deposit.status === "pending"
                        ? "bg-yellow-500/10 text-yellow-500"
                        : deposit.status === "confirmed"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                    }`}>{deposit.status}</span>

                    {deposit.status === "pending" && (
                      <>
                        <button
                          onClick={() => void handleConfirmDeposit(deposit)}
                          disabled={actionLoading === deposit.id}
                          className="rounded-lg bg-green-600 p-2 text-white transition hover:bg-green-700 disabled:opacity-50"
                          title="Confirm"
                        >
                          {actionLoading === deposit.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        </button>
                        <button
                          onClick={() => void handleRejectDeposit(deposit)}
                          disabled={actionLoading === deposit.id}
                          className="rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700 disabled:opacity-50"
                          title="Reject"
                        >
                          {actionLoading === deposit.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
