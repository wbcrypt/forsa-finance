import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, CreditCard, CheckCircle, AlertTriangle, BarChart3, ScrollText, LogOut, ChevronLeft, ChevronRight, Building2, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Verify Payments', icon: CheckCircle, path: '/verify' },
  { label: 'Late Payments', icon: AlertTriangle, path: '/late' },
  { label: 'Student Ledger', icon: Users, path: '/ledger' },
  { label: 'Disbursements', icon: Building2, path: '/disbursements' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Audit Log', icon: ScrollText, path: '/audit' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={clsx('flex flex-col bg-navy-900 transition-all duration-300 relative flex-shrink-0', collapsed ? 'w-16' : 'w-56')}>
        <div className={clsx('flex items-center h-16 px-4 border-b border-white/5 flex-shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <CreditCard size={15} className="text-white" />
          </div>
          {!collapsed && <div><p className="text-white font-semibold text-sm leading-none">FORSA</p><p className="text-teal-400 text-xs mt-0.5">Finance Portal</p></div>}
        </div>
        {!collapsed && <div className="px-4 pt-4 pb-1"><p className="text-xs font-semibold text-navy-400 uppercase tracking-widest">Finance & Accounting</p></div>}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ label, icon: Icon, path }) => (
            <NavLink key={path} to={path} end={path === '/'}
              title={collapsed ? label : undefined}
              className={({ isActive }) => clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all', isActive ? 'bg-teal-500/15 text-teal-400' : 'text-navy-300 hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-2')}>
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>
        {!collapsed && (
          <div className="mx-3 mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-400 leading-relaxed">🔒 Finance access only. Decisions are managed in the Admin Dashboard.</p>
          </div>
        )}
        <div className={clsx('border-t border-white/5 p-3', collapsed ? 'flex justify-center' : '')}>
          {!collapsed && <div className="mb-2"><p className="text-white text-xs font-medium truncate">{user?.fullName || user?.email}</p><p className="text-navy-400 text-xs">Finance</p></div>}
          <button onClick={handleLogout} className="flex items-center gap-2 text-navy-400 hover:text-white text-xs transition-colors">
            <LogOut size={14} />{!collapsed && 'Sign out'}
          </button>
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md z-10">
          {collapsed ? <ChevronRight size={12} className="text-gray-500" /> : <ChevronLeft size={12} className="text-gray-500" />}
        </button>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 flex-shrink-0">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right"><p className="text-xs font-medium text-gray-700">{user?.fullName}</p><p className="text-xs text-gray-400">Finance · Verify only</p></div>
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center"><span className="text-white text-xs font-semibold">{user?.fullName?.[0] || 'F'}</span></div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6"><div className="max-w-7xl mx-auto"><Outlet /></div></main>
      </div>
    </div>
  )
}
