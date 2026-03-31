/**
 * src/pages/Transactions.tsx — Transactions page
 * Shows all revenue transactions with summary cards.
 */
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { transactionsApi } from '../lib/api';
import Spinner from '../components/ui/Spinner';

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  failed:    'bg-red-500/15 text-red-400 border-red-500/30',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  pending:   Clock,
  failed:    XCircle,
};

export default function Transactions() {
  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.list,
  });

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['revenue'],
    queryFn: transactionsApi.revenue,
  });

  if (txLoading || revLoading) return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="h-10 w-10 text-cyan-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#0D1117] p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500 dark:text-cyan-400 mb-1">
          Finance
        </p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E6EDF3] tracking-tight">
          Transactions
        </h1>
        <p className="mt-1 text-gray-500 dark:text-[#8B949E] text-sm">
          Revenue generated from completed deliveries.
        </p>
      </div>

      {/* Revenue Cards */}
      {revenue && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Revenue',
              value: `Rs. ${revenue.total_revenue.toLocaleString()}`,
              icon: DollarSign,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            },
            {
              label: 'This Month',
              value: `Rs. ${revenue.this_month_revenue.toLocaleString()}`,
              icon: Calendar,
              color: 'text-blue-600 dark:text-blue-400',
              bg: 'bg-blue-50 dark:bg-blue-500/10',
            },
            {
              label: 'This Week',
              value: `Rs. ${revenue.this_week_revenue.toLocaleString()}`,
              icon: TrendingUp,
              color: 'text-violet-600 dark:text-violet-400',
              bg: 'bg-violet-50 dark:bg-violet-500/10',
            },
            {
              label: 'Today',
              value: `Rs. ${revenue.today_revenue.toLocaleString()}`,
              icon: DollarSign,
              color: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-50 dark:bg-amber-500/10',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-xl shadow-md dark:shadow-none border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 dark:text-[#8B949E]">{label}</p>
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon size={15} className={color} />
                </div>
              </div>
              <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {revenue.completed_transactions} completed transactions
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-xl shadow-md border border-gray-200 dark:border-[#30363D] bg-white dark:bg-[#1C2128]">
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-[#30363D] bg-gray-50 dark:bg-[#161B22] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={15} className="text-gray-500 dark:text-[#8B949E]" />
            <h2 className="text-sm font-semibold text-gray-800 dark:text-[#E6EDF3]">
              Transaction History
            </h2>
          </div>
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {transactions?.length || 0} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-[#30363D]">
            <thead className="bg-gray-50 dark:bg-[#161B22]">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-[#8B949E] uppercase tracking-wider">ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-[#8B949E] uppercase tracking-wider">Description</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-[#8B949E] uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-[#8B949E] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 dark:text-[#8B949E] uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#30363D]">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx: any) => {
                  const StatusIcon = STATUS_ICONS[tx.status] || CheckCircle2;
                  return (
                    <tr key={tx.id} className="bg-white dark:bg-[#1C2128] hover:bg-gray-50 dark:hover:bg-[#262D36] transition">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-mono text-gray-500 dark:text-slate-500">
                          TXN-{String(tx.id).padStart(4, '0')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-[#E6EDF3] truncate max-w-xs">
                          {tx.description || `Delivery #${tx.delivery_id}`}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          Delivery #{tx.delivery_id}
                          {tx.rider_id && ` · Rider #${tx.rider_id}`}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          Rs. {tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[tx.status] || STATUS_STYLES.completed}`}>
                          <StatusIcon size={10} />
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500 dark:text-[#8B949E]">
                        {new Date(tx.created_at).toLocaleDateString()}
                        <span className="text-xs text-gray-400 dark:text-slate-600 ml-1">
                          {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="bg-white dark:bg-[#1C2128]">
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <DollarSign size={36} className="text-gray-300 dark:text-[#30363D] mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-[#8B949E]">
                      No transactions yet. Mark a delivery as delivered to generate revenue.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
