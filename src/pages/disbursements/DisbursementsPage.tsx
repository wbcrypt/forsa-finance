import { Building2 } from 'lucide-react'

export default function DisbursementsPage() {
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-semibold text-gray-900">University Disbursements</h1><p className="text-sm text-gray-500 mt-0.5">Tuition payments sent to partner universities</p></div>
      <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center mx-auto mb-4"><Building2 size={22} className="text-navy-500" /></div>
        <p className="text-sm font-medium text-gray-600">Disbursements are managed in the Admin Dashboard</p>
        <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">Finance users can view disbursement history here. University payment execution remains in the admin portal to preserve the separation between financial operations and financing decisions.</p>
        <div className="mt-6 p-4 bg-navy-50 border border-navy-100 rounded-xl text-xs text-navy-600 text-left max-w-sm mx-auto">
          <strong>V2 roadmap:</strong> This page will show full disbursement history, expected payments by university, and payment confirmation status. Bank reconciliation will be available in V2.
        </div>
      </div>
    </div>
  )
}
