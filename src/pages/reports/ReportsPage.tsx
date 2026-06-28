import { useQuery } from '@tanstack/react-query'
import { financeApi } from '../../lib/api'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { Download, BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  const from = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const to = format(endOfMonth(new Date()), 'yyyy-MM-dd')
  const { data: finance } = useQuery({ queryKey: ['report-finance'], queryFn: () => financeApi.reportFinance({ from, to }).then(r => r.data) })
  const { data: collections } = useQuery({ queryKey: ['report-collections'], queryFn: () => financeApi.reportCollections({ from, to }).then(r => r.data) })

  const exportCSV = (data: any, filename: string) => {
    const csv = JSON.stringify(data, null, 2)
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv])); a.download = filename; a.click()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div><h1 className="text-xl font-semibold text-gray-900">Financial Reports</h1><p className="text-sm text-gray-500 mt-0.5">Export accounting reports for {format(new Date(), 'MMMM yyyy')}</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          { title: 'Finance Report', desc: 'Collections, disbursements, outstanding balances', data: finance, file: `forsa-finance-${from}.json` },
          { title: 'Collections Report', desc: 'On-time vs late payments, collection rate by university', data: collections, file: `forsa-collections-${from}.json` },
        ].map(r => (
          <div key={r.title} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center"><BarChart3 size={18} className="text-teal-600" /></div>
              <button onClick={() => exportCSV(r.data, r.file)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"><Download size={13} /> Export</button>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{r.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
            {r.data && (
              <div className="mt-4 space-y-2">
                {Object.entries(r.data).slice(0, 6).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs"><span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span><span className="font-medium text-gray-900">{typeof v === 'number' ? v.toLocaleString() : String(v)}</span></div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="bg-navy-50 border border-navy-100 rounded-xl p-4">
        <p className="text-xs text-navy-600"><strong>Future:</strong> This page will support accounting software export (Sage, QuickBooks), automatic monthly reports, and bank reconciliation. Architecture is ready for these integrations in V2.</p>
      </div>
    </div>
  )
}
