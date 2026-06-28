// src/pages/dashboard/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { financeApi } from '../../lib/api'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import {
  CheckCircle, AlertTriangle, Clock, TrendingUp,
  Building2, DollarSign, Activity, ArrowUp
} from 'lucide-react'
import clsx from 'clsx'

function KPI({ label, value, sub, icon: Icon, color = 'teal', trend }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color?: string; trend?: string
}) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    navy: 'bg-navy-50 text-navy-700',
    blue: 'bg-blue-50 text-blue-600',
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colors[color])}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <ArrowUp size={10} />{trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    receipt_uploaded: 'bg-blue-50 text-blue-700',
    verified: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-600',
    pending_verification: 'bg-amber-50 text-amber-700',
    paid: 'bg-green-50 text-green-700',
    late: 'bg-red-50 text-red-600',
    due_today: 'bg-amber-50 text-amber-700',
    due_soon: 'bg-blue-50 text-blue-600',
    pending: 'bg-gray-100 text-gray-600',
  }
  const labels: Record<string, string> = {
    receipt_uploaded: 'Receipt Uploaded',
    verified: 'Verified',
    rejected: 'Rejected',
    pending_verification: 'Pending',
    paid: 'Paid',
    late: 'Late',
    due_today: 'Due Today',
    due_soon: 'Due Soon',
    pending: 'Pending',
  }
  return (
    <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', cfg[status] || 'bg-gray-100 text-gray-600')}>
      {labels[status] || status}
    </span>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  // Fetch pending receipts
  const { data: pendingData } = useQuery({
    queryKey: ['finance-pending'],
    queryFn: () => financeApi.listReceipts({ status: 'receipt_uploaded', limit: 5 }).then(r => r.data),
  })

  // Fetch late installments
  const { data: lateData } = useQuery({
    queryKey: ['finance-late'],
    queryFn: () => financeApi.lateInstallments({ limit: 5 }).then(r => r.data),
  })

  // Fetch finance report for KPIs
  const { data: reportData } = useQuery({
    queryKey: ['finance-report'],
    queryFn: () => financeApi.reportFinance({ from: monthStart, to: monthEnd }).then(r => r.data),
  })

  const pending = pendingData?.data || []
  const pendingTotal = pendingData?.meta?.total || 0
  const late = lateData?.data || lateData?.items || []
  const lateTotal = lateData?.meta?.total || lateData?.total || 0
  const report = reportData || {}

  const totalCollected = report.totalCollected || report.total_collected || 0
  const totalExpected = report.totalExpected || report.total_expected || 0
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Finance Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(new Date(), 'EEEE, dd MMMM yyyy')} · {user?.email}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI
          label="Pending Verification"
          value={pendingTotal}
          sub="Receipts awaiting review"
          icon={Clock}
          color={pendingTotal > 0 ? 'amber' : 'teal'}
        />
        <KPI
          label="Late Payments"
          value={lateTotal}
          sub="Past due date"
          icon={AlertTriangle}
          color={lateTotal > 0 ? 'red' : 'green'}
        />
        <KPI
          label="Collected This Month"
          value={`${Number(totalCollected).toLocaleString()} TND`}
          sub={`${collectionRate}% collection rate`}
          icon={CheckCircle}
          color="green"
        />
        <KPI
          label="Expected This Month"
          value={`${Number(totalExpected).toLocaleString()} TND`}
          sub="Scheduled installments"
          icon={TrendingUp}
          color="navy"
        />
      </div>

      {/* Two-column detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Verification */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-amber-500" />
              <p className="text-sm font-semibold text-gray-900">Pending Verification</p>
            </div>
            {pendingTotal > 5 && (
              <a href="/verify" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                View all {pendingTotal} →
              </a>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {pending.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">All caught up — no receipts pending</p>
              </div>
            ) : pending.map((p: any) => (
              <div key={p.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p.student_first_name} {p.student_last_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Installment #{p.sequence_number} · {p.bank_name || 'Transfer'}
                    {p.receipt_uploaded_at && ` · ${format(new Date(p.receipt_uploaded_at), 'dd MMM HH:mm')}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{Number(p.student_amount || p.amount).toLocaleString()} TND</p>
                  <StatusPill status={p.status} />
                </div>
              </div>
            ))}
          </div>
          {pending.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <a href="/verify" className="text-xs text-teal-600 font-medium hover:text-teal-700">
                Go to Payment Verification →
              </a>
            </div>
          )}
        </div>

        {/* Late Payments */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              <p className="text-sm font-semibold text-gray-900">Late Payments</p>
            </div>
            {lateTotal > 5 && (
              <a href="/late" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                View all {lateTotal} →
              </a>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {late.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No late payments — great standing</p>
              </div>
            ) : (late.slice(0, 5) as any[]).map((inst: any, i: number) => (
              <div key={inst.id || i} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {inst.student_first_name || inst.first_name} {inst.student_last_name || inst.last_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    Due {inst.due_date ? format(new Date(inst.due_date), 'dd MMM yyyy') : '—'}
                    {inst.days_overdue ? ` · ${inst.days_overdue} days overdue` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-red-600">{Number(inst.amount).toLocaleString()} TND</p>
                  <StatusPill status="late" />
                </div>
              </div>
            ))}
          </div>
          {late.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50">
              <a href="/late" className="text-xs text-teal-600 font-medium hover:text-teal-700">
                Manage late payments →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Monthly collection progress */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-navy-700" />
            <p className="text-sm font-semibold text-gray-900">Monthly Collection Progress</p>
          </div>
          <span className="text-lg font-bold text-gray-900">{collectionRate}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className={clsx('h-full rounded-full transition-all duration-700',
              collectionRate >= 90 ? 'bg-green-500' : collectionRate >= 70 ? 'bg-teal-500' : 'bg-amber-400')}
            style={{ width: `${Math.min(collectionRate, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{Number(totalCollected).toLocaleString()} TND collected</span>
          <span>{Number(totalExpected).toLocaleString()} TND expected</span>
        </div>
      </div>
    </div>
  )
}
