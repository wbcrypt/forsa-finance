// src/pages/ledger/LedgerPage.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '../../lib/api'
import { format } from 'date-fns'
import { Search, ChevronDown, ChevronUp, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react'
import clsx from 'clsx'
import api from '../../lib/api'

function InstallmentBadge({ status }: { status: string }) {
  const cfg: Record<string, { icon: string; color: string; label: string }> = {
    paid: { icon: '✓', color: 'bg-green-50 text-green-700 border-green-200', label: 'Paid' },
    verified: { icon: '✓', color: 'bg-green-50 text-green-700 border-green-200', label: 'Verified' },
    late: { icon: '!', color: 'bg-red-50 text-red-600 border-red-200', label: 'Overdue' },
    default_risk: { icon: '!!', color: 'bg-red-100 text-red-700 border-red-300', label: 'Default Risk' },
    due_today: { icon: '→', color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Due Today' },
    due_soon: { icon: '→', color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Due Soon' },
    pending: { icon: '○', color: 'bg-gray-100 text-gray-500 border-gray-200', label: 'Pending' },
    partial: { icon: '½', color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Partial' },
    waived: { icon: '–', color: 'bg-gray-50 text-gray-400 border-gray-200', label: 'Waived' },
  }
  const c = cfg[status] || cfg.pending
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', c.color)}>
      <span className="font-bold">{c.icon}</span> {c.label}
    </span>
  )
}

function StudentRow({ student }: { student: any }) {
  const [expanded, setExpanded] = useState(false)

  const { data: scheduleData } = useQuery({
    queryKey: ['student-schedule', student.application_id],
    queryFn: () => financeApi.scheduleForApp(student.application_id).then(r => r.data),
    enabled: expanded && !!student.application_id,
  })

  const schedule = scheduleData?.schedule
  const installments = scheduleData?.installments || []
  const paidCount = installments.filter((i: any) => ['paid', 'verified'].includes(i.status)).length
  const lateCount = installments.filter((i: any) => ['late', 'default_risk'].includes(i.status)).length
  const progress = installments.length > 0 ? (paidCount / installments.length) * 100 : 0

  return (
    <>
      <tr className={clsx('border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer',
        lateCount > 0 && 'bg-red-50/20')} onClick={() => setExpanded(!expanded)}>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2">
            <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
              lateCount > 0 ? 'bg-red-500' : paidCount === installments.length && installments.length > 0 ? 'bg-green-500' : 'bg-navy-700')}>
              {(student.first_name?.[0] || '') + (student.last_name?.[0] || '')}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{student.first_name} {student.last_name}</p>
              <p className="text-xs text-gray-400">{student.email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-500">{student.university_name || '—'}</td>
        <td className="px-4 py-3.5 text-sm font-medium text-gray-900">
          {student.tuition_amount ? `${Number(student.tuition_amount).toLocaleString()} TND` : '—'}
        </td>
        <td className="px-4 py-3.5">
          {installments.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={clsx('h-full rounded-full',
                    lateCount > 0 ? 'bg-red-400' : 'bg-teal-500')} style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">{paidCount}/{installments.length}</span>
              </div>
              {lateCount > 0 && <p className="text-xs text-red-600">{lateCount} overdue</p>}
            </div>
          ) : <span className="text-xs text-gray-400">No schedule</span>}
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-400">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>

      {/* Expanded ledger */}
      {expanded && (
        <tr className="border-b border-gray-100">
          <td colSpan={5} className="px-4 py-4 bg-gray-50/30">
            {!scheduleData ? (
              <div className="text-center py-4 text-sm text-gray-400">Loading ledger…</div>
            ) : installments.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-400">No payment schedule yet</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Payment Ledger — {student.first_name} {student.last_name}
                  </p>
                  {schedule && (
                    <p className="text-xs text-gray-400">
                      Total: {Number(schedule.total_amount).toLocaleString()} TND ·
                      {installments.length} installments
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  {installments.map((inst: any) => (
                    <div key={inst.id} className={clsx(
                      'flex items-center justify-between rounded-xl px-4 py-2.5 border',
                      ['paid', 'verified'].includes(inst.status) ? 'bg-green-50/50 border-green-100' :
                      ['late', 'default_risk'].includes(inst.status) ? 'bg-red-50 border-red-100' :
                      inst.status === 'due_today' ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'
                    )}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-gray-400 w-6">#{inst.sequence_number}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {inst.due_date ? format(new Date(inst.due_date), 'MMMM yyyy') : `Installment ${inst.sequence_number}`}
                          </p>
                          {inst.paid_at && (
                            <p className="text-xs text-green-600">Paid {format(new Date(inst.paid_at), 'dd MMM yyyy')}</p>
                          )}
                          {['late', 'default_risk'].includes(inst.status) && inst.due_date && (
                            <p className="text-xs text-red-500">
                              Overdue since {format(new Date(inst.due_date), 'dd MMM yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {Number(inst.amount).toLocaleString()} TND
                        </span>
                        <InstallmentBadge status={inst.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function LedgerPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['finance-students', search, filter, page],
    queryFn: () => api.get('/applications', {
      params: {
        search: search || undefined,
        status: filter === 'all' ? undefined : filter,
        page, limit: 20
      }
    }).then(r => r.data),
  })

  const students = data?.data || []
  const meta = data?.meta || { total: 0, totalPages: 1 }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Student Ledger</h1>
        <p className="text-sm text-gray-500 mt-0.5">Complete payment history per student — click any row to expand</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
          <div className="relative flex-1 min-w-48 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search student…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy-400" />
            {search && <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
          </div>
          <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none text-gray-600">
            <option value="all">All students</option>
            <option value="active_student">Active</option>
            <option value="approved_level2">Approved L2</option>
            <option value="approved_level1">Approved L1</option>
          </select>
          <p className="text-xs text-gray-400">{meta.total} students</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">No students found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">University</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {students.map((s: any) => <StudentRow key={s.id} student={s} />)}
            </tbody>
          </table>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{meta.total} total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <span className="px-3 py-1 text-xs text-gray-500">{page} / {meta.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
