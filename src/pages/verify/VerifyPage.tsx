// src/pages/verify/VerifyPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { financeApi } from '../../lib/api'
import { format } from 'date-fns'
import {
  CheckCircle, XCircle, Eye, Search, X, Download,
  Clock, Filter, Loader2, ChevronDown, ChevronUp, FileText
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  receipt_uploaded: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Receipt Uploaded' },
  pending_verification: { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
  verified: { color: 'bg-green-50 text-green-700 border-green-200', label: '✓ Verified' },
  rejected: { color: 'bg-red-50 text-red-600 border-red-200', label: 'Rejected' },
  confirmed: { color: 'bg-green-50 text-green-700 border-green-200', label: '✓ Confirmed' },
}

function PaymentRow({ p, onVerify, onReject, onView }: {
  p: any
  onVerify: () => void
  onReject: () => void
  onView: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[p.status] || { color: 'bg-gray-100 text-gray-600', label: p.status }
  const isPending = ['receipt_uploaded', 'pending_verification'].includes(p.status)

  return (
    <>
      <tr className={clsx('border-b border-gray-50 hover:bg-gray-50/50 transition-colors', isPending && 'bg-blue-50/20')}>
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">{p.student_first_name} {p.student_last_name}</p>
            <p className="text-xs text-gray-400">{p.student_email}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-sm font-mono text-gray-600">#{p.sequence_number}</td>
        <td className="px-4 py-3">
          <p className="text-sm font-bold text-gray-900">{Number(p.student_amount || p.amount).toLocaleString()} TND</p>
          {p.student_amount && p.student_amount !== p.amount && (
            <p className="text-xs text-amber-600">Expected: {Number(p.installment_amount).toLocaleString()}</p>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy') : '—'}
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {p.bank_name || '—'}
          {p.reference_number && <span className="block font-mono text-gray-400">{p.reference_number}</span>}
        </td>
        <td className="px-4 py-3">
          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full border', cfg.color)}>
            {cfg.label}
          </span>
          {p.receipt_uploaded_at && (
            <p className="text-xs text-gray-400 mt-0.5">{format(new Date(p.receipt_uploaded_at), 'dd MMM HH:mm')}</p>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1 items-center">
            {p.receipt_filename && (
              <button onClick={onView} className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors" title="View receipt">
                <FileText size={14} />
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {isPending && (
              <>
                <button onClick={onVerify} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Verify — confirm payment in bank">
                  <CheckCircle size={15} />
                </button>
                <button onClick={onReject} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Reject — receipt invalid">
                  <XCircle size={15} />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/50 border-b border-gray-100">
          <td colSpan={7} className="px-4 py-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'Due date', value: p.due_date ? format(new Date(p.due_date), 'dd MMM yyyy') : '—' },
                { label: 'Method', value: p.payment_method?.replace(/_/g, ' ') || '—' },
                { label: 'Receipt file', value: p.receipt_filename || 'None uploaded' },
                { label: 'Notes', value: p.notes || '—' },
                { label: 'Verified by', value: p.verified_by_name || '—' },
                { label: 'Verified at', value: p.verified_at ? format(new Date(p.verified_at), 'dd MMM yyyy HH:mm') : '—' },
                { label: 'Verification notes', value: p.verification_notes || '—' },
                { label: 'Rejection reason', value: p.rejection_reason || '—' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-gray-400 font-medium">{item.label}</p>
                  <p className="text-gray-700 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function VerifyPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('receipt_uploaded')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<any>(null)
  const [showVerify, setShowVerify] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [verifyNotes, setVerifyNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const TABS = [
    { id: 'receipt_uploaded', label: 'Awaiting Verification' },
    { id: 'verified', label: 'Verified' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All' },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['receipts', tab, search, page],
    queryFn: () => financeApi.listReceipts({
      status: tab === 'all' ? undefined : tab,
      search: search || undefined,
      page, limit: 25
    }).then(r => r.data),
  })

  const payments = data?.data || []
  const meta = data?.meta || { total: 0, totalPages: 1 }

  const verifyMutation = useMutation({
    mutationFn: () => financeApi.verifyPayment(selected.id, verifyNotes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receipts'] })
      qc.invalidateQueries({ queryKey: ['finance-pending'] })
      setShowVerify(false); setVerifyNotes(''); setSelected(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => financeApi.rejectPayment(selected.id, rejectReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receipts'] })
      qc.invalidateQueries({ queryKey: ['finance-pending'] })
      setShowReject(false); setRejectReason(''); setSelected(null)
    },
  })

  const exportCSV = () => {
    const headers = ['Student', 'Installment', 'Amount', 'Payment Date', 'Bank', 'Reference', 'Status', 'Uploaded At', 'Verified By', 'Notes']
    const rows = payments.map((p: any) => [
      `${p.student_first_name} ${p.student_last_name}`,
      p.sequence_number, p.student_amount || p.amount,
      p.payment_date, p.bank_name, p.reference_number, p.status,
      p.receipt_uploaded_at, p.verified_by_name, p.verification_notes || p.rejection_reason
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v || ''}"`).join(',")).join('\n")
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `forsa-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Payment Verification</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Check the bank account, then verify or reject each receipt
          </p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Bank reminder */}
      <div className="bg-navy-50 border border-navy-100 rounded-xl px-4 py-3 text-sm text-navy-700">
        <strong>Verification process:</strong> Check your Zitouna Bank account first → confirm payment received → click Verify.
        The bank account is the source of truth, not the receipt.
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setPage(1) }}
              className={clsx('px-4 py-3 text-sm font-medium border-b-2 transition-all',
                tab === t.id ? 'text-navy-800 border-navy-800' : 'text-gray-500 border-transparent hover:text-gray-700')}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-50">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search student name or email…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-navy-400" />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={22} className="text-teal-500 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">
              {tab === 'receipt_uploaded' ? 'No receipts pending verification' : 'No records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Student', '#', 'Amount', 'Payment Date', 'Bank / Ref', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => (
                  <PaymentRow key={p.id} p={p}
                    onView={() => setSelected(p)}
                    onVerify={() => { setSelected(p); setShowVerify(true) }}
                    onReject={() => { setSelected(p); setShowReject(true) }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{meta.total} total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Previous
              </button>
              <span className="px-3 py-1 text-xs text-gray-500">{page} / {meta.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verify Modal */}
      {showVerify && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Verify Payment</h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-green-800">
                ✓ Confirming: {Number(selected.student_amount || selected.amount).toLocaleString()} TND
                from {selected.student_first_name} {selected.student_last_name}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Payment date: {selected.payment_date ? format(new Date(selected.payment_date), 'dd MMM yyyy') : '—'}
                {selected.bank_name && ` · ${selected.bank_name}`}
              </p>
            </div>
            <div className="bg-navy-50 border border-navy-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-navy-700">
                By verifying, you confirm you have checked the FORSA bank account and this payment has been received.
                The installment will be marked as paid.
              </p>
            </div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Verification notes (optional)</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm h-16 resize-none focus:outline-none focus:border-navy-400 mb-4"
              value={verifyNotes} onChange={e => setVerifyNotes(e.target.value)}
              placeholder="e.g. Confirmed in bank statement dated 28/06/2026" />
            <div className="flex gap-3">
              <button onClick={() => { setShowVerify(false); setVerifyNotes('') }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => verifyMutation.mutate()} disabled={verifyMutation.isPending}
                className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {verifyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Confirm & Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Reject Receipt</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700">
                The student will need to resubmit a correct receipt. The installment remains unpaid.
              </p>
            </div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Reason for rejection *</label>
            <textarea className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm h-20 resize-none focus:outline-none focus:border-navy-400 mb-4"
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Wrong reference number · Amount does not match · Payment not found in bank account" />
            <div className="flex gap-3">
              <button onClick={() => { setShowReject(false); setRejectReason('') }}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {rejectMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Reject Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
