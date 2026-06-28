import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { financeApi } from '../../lib/api'
import { format } from 'date-fns'
import { ScrollText } from 'lucide-react'

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['finance-audit', page],
    queryFn: () => financeApi.auditLogs({ page, limit: 30, module: 'payment' }).then(r => r.data),
  })
  const logs = data?.data || data?.items || []
  const meta = data?.meta || { total: 0, totalPages: 1 }

  const ACTION_COLOR: Record<string, string> = {
    'payment.verified': 'text-green-600 bg-green-50',
    'payment.rejected': 'text-red-600 bg-red-50',
    'payment.recorded': 'text-blue-600 bg-blue-50',
    'payment.reversed': 'text-amber-600 bg-amber-50',
  }

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-semibold text-gray-900">Payment Audit Log</h1><p className="text-sm text-gray-500 mt-0.5">{meta.total} payment events · every action logged with user and timestamp</p></div>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16"><ScrollText size={28} className="text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">No payment audit events yet</p></div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">{['Timestamp', 'Action', 'Performed By', 'Target', 'Details'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>
              {logs.map((log: any, i: number) => (
                <tr key={log.id || i} className="border-b border-gray-50 hover:bg-gray-50/30">
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{log.created_at ? format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss') : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full ${ACTION_COLOR[log.action] || 'text-gray-600 bg-gray-100'}`}>{log.action}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{log.user_name || log.user_email || log.user_id || '—'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{log.target_id?.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{log.new_value ? JSON.stringify(log.new_value).slice(0, 80) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{meta.total} total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <span className="px-3 py-1 text-xs text-gray-500">{page}/{meta.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
