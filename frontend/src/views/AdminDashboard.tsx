import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { Logo } from '../components/Logo'

interface UserItem {
  id: str
  full_name: str
  email: str
  role: 'farmer' | 'expert' | 'admin'
  is_active: bool
  country: str
  state: str
  district: str
  city_town: str
  village: str
  preferred_language: str
  created_at: str
}

interface AdminStats {
  users: {
    total: number
    farmers: number
    experts: number
    admins: number
  }
  advisories: {
    total: number
    pending: number
    approved: number
    modified: number
    rejected: number
  }
  analyses: {
    soil_reports: number
    crop_analyses: number
  }
}

export function AdminDashboard() {
  const { t, setView, logout, lang } = useApp()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Create User Form state
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'farmer' | 'expert' | 'admin'>('farmer')
  const [newLang, setNewLang] = useState('en')
  const [createLoading, setCreateLoading] = useState(false)

  const token = localStorage.getItem('farmassist_token')

  const fetchStats = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (e) {}
  }

  const fetchUsers = async () => {
    try {
      let url = 'http://127.0.0.1:8000/api/admin/users'
      const params: string[] = []
      if (roleFilter !== 'all') params.push(`role=${roleFilter}`)
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`)
      if (params.length > 0) url += `?${params.join('&')}`

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchUsers()
  }, [roleFilter, searchQuery])

  const toggleUserStatus = async (user: UserItem) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_active: !user.is_active }),
      })
      if (res.ok) {
        fetchUsers()
        fetchStats()
      }
    } catch (e) {}
  }

  const changeUserRole = async (userId: string, newRoleVal: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ role: newRoleVal }),
      })
      if (res.ok) {
        fetchUsers()
        fetchStats()
      }
    } catch (e) {}
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setCreateLoading(true)

    try {
      const res = await fetch('http://127.0.0.1:8000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          full_name: newName,
          role: newRole,
          preferred_language: newLang,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || 'Failed to create user.')
      }

      setShowCreateModal(false)
      setNewEmail('')
      setNewPassword('')
      setNewName('')
      fetchUsers()
      fetchStats()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-forest text-cream px-6 py-4 border-b border-forest/30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Logo variant="light" size={28} />
          <span className="text-cream/40">|</span>
          <span className="font-display font-semibold text-lg text-cream">Admin Control Panel</span>
          <span className="bg-rain/20 text-rain border border-rain/30 text-xs font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Role: Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('settings')}
            className="text-xs text-cream/70 hover:text-cream border border-cream/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            ⚙️ {t('nav_settings')}
          </button>
          <button
            onClick={() => logout()}
            className="text-xs bg-harvest/80 hover:bg-harvest text-cream font-medium px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>⎋</span>
            <span>{t('nav_logout')}</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 p-6 space-y-6 max-w-screen-2xl mx-auto w-full">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-pebble rounded-xl p-4 space-y-1 hover:border-leaf/40 transition-colors">
            <div className="text-sage text-xs font-mono uppercase tracking-wider">Total Farmers</div>
            <div className="font-display text-3xl text-forest font-bold">{stats?.users?.farmers ?? '—'}</div>
            <div className="text-sage text-xs">Registered agricultural users</div>
          </div>
          <div className="bg-white border border-pebble rounded-xl p-4 space-y-1 hover:border-leaf/40 transition-colors">
            <div className="text-sage text-xs font-mono uppercase tracking-wider">Total Experts</div>
            <div className="font-display text-3xl text-rain font-bold">{stats?.users?.experts ?? '—'}</div>
            <div className="text-sage text-xs">Agricultural scientists & officers</div>
          </div>
          <div className="bg-white border border-pebble rounded-xl p-4 space-y-1 hover:border-leaf/40 transition-colors">
            <div className="text-sage text-xs font-mono uppercase tracking-wider">Total Advisories</div>
            <div className="font-display text-3xl text-harvest font-bold">{stats?.advisories?.total ?? '—'}</div>
            <div className="text-sage text-xs">{stats?.advisories?.pending ?? 0} pending review</div>
          </div>
          <div className="bg-white border border-pebble rounded-xl p-4 space-y-1 hover:border-leaf/40 transition-colors">
            <div className="text-sage text-xs font-mono uppercase tracking-wider">Soil Reports</div>
            <div className="font-display text-3xl text-meadow font-bold">{stats?.analyses?.soil_reports ?? '—'}</div>
            <div className="text-sage text-xs">Processed NLP reports</div>
          </div>
          <div className="bg-white border border-pebble rounded-xl p-4 space-y-1 hover:border-leaf/40 transition-colors">
            <div className="text-sage text-xs font-mono uppercase tracking-wider">Crop Analyses</div>
            <div className="font-display text-3xl text-charcoal font-bold">{stats?.analyses?.crop_analyses ?? '—'}</div>
            <div className="text-sage text-xs">PyTorch Deep Learning scans</div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-white border border-pebble rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pebble/60 pb-4">
            <div>
              <h2 className="font-display text-xl text-charcoal font-bold">User Account Governance</h2>
              <p className="text-sage text-xs mt-0.5">Manage farmer, expert, and admin roles, activation status, and profiles.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-forest text-cream font-medium text-xs rounded-xl hover:bg-leaf transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>+</span>
              <span>Create New User</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex gap-1 bg-mist p-1 rounded-xl w-fit">
              {['all', 'farmer', 'expert', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wide transition-all cursor-pointer ${
                    roleFilter === r ? 'bg-white text-charcoal shadow-sm font-semibold' : 'text-sage hover:text-charcoal'
                  }`}
                >
                  {r === 'all' ? 'All Roles' : r}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="px-4 py-2 border border-pebble rounded-xl bg-cream/40 text-charcoal text-xs placeholder:text-sage/60 focus:outline-none focus:ring-2 focus:ring-leaf/40 w-full sm:w-64"
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal border-collapse">
              <thead>
                <tr className="border-b border-pebble bg-mist/50 text-sage font-mono uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pebble/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-mist/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-charcoal flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-cream ${
                        u.role === 'admin' ? 'bg-risk' : u.role === 'expert' ? 'bg-rain' : 'bg-forest'
                      }`}>
                        {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div>{u.full_name || 'Unnamed User'}</div>
                        <div className="text-sage text-[10px] font-mono">{u.id.substring(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-sage">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => changeUserRole(u.id, e.target.value)}
                        className={`text-xs font-mono font-medium px-2 py-1 rounded border bg-white cursor-pointer ${
                          u.role === 'admin' ? 'text-risk border-risk/30' : u.role === 'expert' ? 'text-rain border-rain/30' : 'text-forest border-forest/30'
                        }`}
                      >
                        <option value="farmer">Farmer</option>
                        <option value="expert">Expert</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-sage">
                      {u.district || u.city_town || 'Kakinada'}, {u.state || 'AP'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-medium ${
                        u.is_active ? 'bg-meadow/15 text-meadow border border-meadow/30' : 'bg-risk/15 text-risk border border-risk/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-meadow' : 'bg-risk'}`} />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono uppercase text-sage">{u.preferred_language || 'en'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        className={`px-3 py-1 rounded-lg font-medium text-[11px] transition-colors cursor-pointer ${
                          u.is_active
                            ? 'border border-risk/30 text-risk hover:bg-risk/10'
                            : 'border border-meadow/30 text-meadow hover:bg-meadow/10'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal for Creating User */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-pebble step-in">
            <div className="flex items-center justify-between border-b border-pebble pb-3">
              <h3 className="font-display font-bold text-lg text-charcoal">Create New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-sage hover:text-charcoal text-lg">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-risk/10 border border-risk/30 text-risk text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-sage uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Babu"
                  className="w-full px-3.5 py-2.5 border border-pebble rounded-xl text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-leaf/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-sage uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@farmassist.ai"
                  className="w-full px-3.5 py-2.5 border border-pebble rounded-xl text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-leaf/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-sage uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3.5 py-2.5 border border-pebble rounded-xl text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-leaf/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-sage uppercase mb-1">User Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-pebble rounded-xl text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-leaf/40 cursor-pointer"
                  >
                    <option value="farmer">Farmer</option>
                    <option value="expert">Agricultural Expert</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-sage uppercase mb-1">Language</label>
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-pebble rounded-xl text-xs bg-cream/30 focus:outline-none focus:ring-2 focus:ring-leaf/40 cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="te">తెలుగు — Telugu</option>
                    <option value="ta">தமிழ் — Tamil</option>
                    <option value="hi">हिन्दी — Hindi</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-pebble rounded-xl text-xs text-sage hover:text-charcoal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-forest text-cream font-medium text-xs rounded-xl hover:bg-leaf transition-colors cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
