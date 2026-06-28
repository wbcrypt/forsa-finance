// src/pages/late/LatePage.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '../../lib/api'
import { format } from 'date-fns'
import { AlertTriangle, Download } from 'lucide-react'

export default function LatePage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['late-payments', page],
    queryFn: () => financeApi.lateInstallments({ page, limit: 25 }).then(r => r.data),
  })

  const items = data?.data || data?.items || []
  const meta = data?.meta || { total: data?.total || 0, totalPages: 1 }

  const exportCSV = () => {
    const rows = items.map((i: any) => [
      `${i.first_name || i.student_first_name} ${i.last_name || i.student_last_name}`,
      i.email || i.student_email, i.amount, i.due_date, i.status, i.days_overdue || ''
    ])
    const csv = [['Student', 'Email', 'Amount', 'Due Date', 'Status', 'Days Overdue'], ...rows]
      .map(r => r.map(v => `"${v || ''}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `forsa-late-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Late Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meta.total} overdue installments requiring follow-up</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {meta.total > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{meta.total} installment{meta.total !== 1 ? 's' : ''} overdue.</strong>{' '}
            Contact students within 3 days of the due date. Escalate to management after 10 days.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-sm font-medium text-gray-600">No late payments — excellent collection rate</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Student', 'University', 'Amount', 'Due Date', 'Days Overdue', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((inst: any, i: number) => (
                <tr key={inst.id || i} className="border-b border-gray-50 hover:bg-red-50/20">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{inst.first_name || inst.student_first_name} {inst.last_name || inst.student_last_name}</p>
                    <p className="text-xs text-gray-400">{inst.email || inst.student_email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{inst.university_name || '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">{Number(inst.amount).toLocaleString()} TND</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{inst.due_date ? format(new Date(inst.due_date), 'dd MMM yyyy') : '—'}</td>
                  <td className="px-4 py-3">
                    {inst.days_overdue ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${inst.days_overdue > 30 ? 'bg-red-100 text-red-700' : inst.days_overdue > 10 ? 'bg-amber-50 text-amber-700' : 'bg-orange-50 text-orange-700'}`}>
                        {inst.days_overdue} days
                      </span>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                      {inst.status === 'default_risk' ? 'Default Risk' : 'Overdue'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
