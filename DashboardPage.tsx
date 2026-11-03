import { useMemo } from 'react';

type DashboardMode = 'dashboard' | 'live-trading' | 'demo';

interface DashboardPageProps {
  mode?: DashboardMode;
}

const modeContent: Record<DashboardMode, { title: string; description: string }> = {
  dashboard: {
    title: 'Dashboard',
    description: 'Your trading overview and account activity.',
  },
  'live-trading': {
    title: 'Live Trading',
    description: 'Your live trading workspace.',
  },
  demo: {
    title: 'Demo Trading',
    description: 'Your demo trading workspace.',
  },
};

export const DashboardPage = ({ mode = 'dashboard' }: DashboardPageProps) => {
  const content = useMemo(() => modeContent[mode], [mode]);

  return (
    <section className="min-h-[calc(100vh-72px)] bg-[#edf3f8] p-5 lg:p-6">
      <div className="mx-auto max-w-[1460px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{content.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{content.description}</p>
        </div>

        <div className="rounded-2xl border border-[#dfe7f0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Welcome to AITradePro</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This dashboard page was missing from the uploaded project archive and has
            been restored with a clean, build-compatible page so the application can
            compile. Your account, balance, and trade pages remain separate.
          </p>
        </div>
      </div>
    </section>
  );
};
