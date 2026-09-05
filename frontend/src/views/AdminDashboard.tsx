import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { Logo } from '../components/Logo'
import { apiRequest } from '../lib/api'

interface UserItem {
  id: string
  full_name: string
  display_name?: string
  email: string
  role: 'farmer' | 'expert' | 'admin'
  is_active: boolean
  auth_provider?: string
  country?: string
  state?: string
  district?: string
  village_or_city?: string
  preferred_language?: string
  created_at: string
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
  const { t, setView, logout, user: currentUser } = useApp()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Confirmation Modal state for sensitive operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  // Create User Form state
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'expert' | 'farmer'>('expert')
  const [newState, setNewState] = useState('Andhra Pradesh')
  const [newDistrict, setNewDistrict] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // Edit User Form state
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role: 'farmer' as 'farmer' | 'expert',
    state: '',
    district: '',
    village_or_city: '',
    is_active: true,
    password: '',
  })
  const [editLoading, setEditLoading] = useState(false)

  const fetchStats = async () => {
    try {
      const data = await apiRequest('/admin/stats')
      setStats(data)
    } catch (e) {
      console.warn('[ADMIN] Stats fetch notice:', e)
    }
  }

  const fetchUsers = async () => {
    try {
      let endpoint = '/admin/users'
      const params: string[] = []
      if (roleFilter !== 'all') params.push(`role=${roleFilter}`)
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`)
      if (params.length > 0) endpoint += `?${params.join('&')}`

      const data = await apiRequest(endpoint)
      setUsers(data)
    } catch (e) {
      console.warn('[ADMIN] Users fetch notice:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchUsers()
  }, [roleFilter, searchQuery])

  const handleToggleUserStatus = (targetUser: UserItem) => {
    const action = targetUser.is_active ? 'deactivate' : 'activate'
    setConfirmModal({
      isOpen: true,
      title: `Confirm Account ${action.toUpperCase()}`,
      message: `Are you sure you want to ${action} account for ${targetUser.full_name || targetUser.email}?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        try {
          await apiRequest(`/admin/users/${targetUser.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ is_active: !targetUser.is_active }),
          })
          setSuccessMsg(`User ${targetUser.email} status updated.`)
          fetchUsers()
          fetchStats()
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to update user status.')
        }
      },
    })
  }

  const handleChangeUserRole = (targetUser: UserItem, newRoleVal: string) => {
    if (targetUser.role === newRoleVal) return

    setConfirmModal({
      isOpen: true,
      title: 'Confirm Role Change',
      message: `Are you sure you want to change role of ${targetUser.full_name || targetUser.email} from ${targetUser.role.toUpperCase()} to ${newRoleVal.toUpperCase()}?`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        try {
          await apiRequest(`/admin/users/${targetUser.id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRoleVal }),
          })
          setSuccessMsg(`User role updated to ${newRoleVal}.`)
          fetchUsers()
          fetchStats()
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to update user role.')
        }
      },
    })
  }

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!newName.trim()) {
      setErrorMsg('Full Name is required.')
      return
    }
    if (!newEmail.trim()) {
      setErrorMsg('Email Address is required.')
      return
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setCreateLoading(true)

    try {
      await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword,
          full_name: newName.trim(),
          role: newRole,
          state: newState.trim() || undefined,
          district: newDistrict.trim() || undefined,
          preferred_language: 'en',
        }),
      })

      setSuccessMsg(`Successfully created new ${newRole.toUpperCase()} account: ${newEmail}`)
      setShowCreateModal(false)
      setNewEmail('')
      setNewPassword('')
      setConfirmPassword('')
      setNewName('')
      setNewRole('expert')
      setNewDistrict('')
      fetchUsers()
      fetchStats()
    } catch (err: any) {
      console.error('[ADMIN] Create user error:', err)
      setErrorMsg(err.message || 'Failed to create user.')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleOpenEdit = (targetUser: UserItem) => {
    setEditingUser(targetUser)
    setEditForm({
      full_name: targetUser.full_name || targetUser.display_name || '',
      email: targetUser.email || '',
      role: (targetUser.role === 'admin' ? 'farmer' : targetUser.role) as 'farmer' | 'expert',
      state: targetUser.state || '',
      district: targetUser.district || '',
      village_or_city: targetUser.village_or_city || '',
      is_active: targetUser.is_active,
      password: '',
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setEditLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const payload: any = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        state: editForm.state.trim(),
        district: editForm.district.trim(),
        village_or_city: editForm.village_or_city.trim(),
        is_active: editForm.is_active,
      }
      if (editForm.password && editForm.password.trim().length >= 6) {
        payload.password = editForm.password.trim()
      }

      await apiRequest(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })

      setSuccessMsg(`User ${editForm.email} updated successfully.`)
      setEditingUser(null)
      fetchUsers()
      fetchStats()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user.')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteUser = (targetUser: UserItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Delete User',
      message: `Are you sure you want to permanently delete user "${targetUser.full_name || targetUser.email}" from the database? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        try {
          await apiRequest(`/admin/users/${targetUser.id}`, {
            method: 'DELETE',
          })
          setSuccessMsg(`User ${targetUser.email} deleted successfully.`)
          fetchUsers()
          fetchStats()
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to delete user.')
        }
      },
    })
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-forest text-cream px-6 py-4 border-b border-forest/30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Logo variant="light" size={28} />
          <span className="text-cream/40">|</span>
          <span className="font-display font-semibold text-lg text-cream">Administrator Console</span>
          <span className="bg-rain/20 text-rain border border-rain/30 text-xs font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Admin: {currentUser?.full_name || currentUser?.email || 'Charan'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('settings')}
            className="text-xs text-cream/70 hover:text-cream border border-cream/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            ⚙️ {t('nav_settings')}
          </button>
          <button
            id="admin-logout-btn"
            onClick={() => logout()}
            className="text-xs bg-harvest/80 hover:bg-harvest text-cream font-medium px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>⎋</span>
            <span>{t('nav_logout')}</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 p-6 space-y-6 max-w-screen-2xl mx-auto w-full">
        {/* Alerts & Messages */}
        {errorMsg && (
          <div className="p-4 bg-risk/10 border border-risk/30 text-risk text-xs rounded-xl flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="cursor-pointer font-bold">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-forest/10 border border-forest/30 text-forest text-xs rounded-xl flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="cursor-pointer font-bold">✕</button>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-pebble rounded-xl p-4 space-y-1 hover:border-leaf/40 transition-colors shadow-sm">
            <div className="text-sage text-xs font-mono uppercase tracking-wider">Total Farmers</div>
            <div className="font-display text-3xl text-forest font-bold">{stats?.users?.farmers ?? '—'}</div>
            <div className="text-sage text-xs">Registered agricultural users</div>
          </div>
          <div className="bg-white border border-pebble rounded-xl p-4 space-y-1 hover:border-leaf/40 transition-colors shadow-sm">
            <div className="text-sage text-xs font-mono uppercase tracking-wider">Total Experts</div>
            <div className="font-display text-3xl text-rain font-bold">{stats?.users?.experts ?? '—'}</div>
            <div className="text-sage text-xs">Agricultural scientists & officers</div>
          </div>
          <div className="bg-white border border-pebble rounded-xl p-4 space-y-1 hover:border-leaf/40 transition-colors shadow-sm">
            <div className="text-sage text-xs font-mono uppercase tracking-wider">Total Advisories</div>
            <div className="font-display text-3xl text-harvest font-bold">{stats?.advisories?.total ?? '—'}</div>
            <div className="text-sage text-xs">{stats?.advisories?.pending ?? 0} pending review</div>
          </div>
          <div className="bg-white border border-pebble rounded-xl p-4 space-y-1 hover:border-leaf/40 transition-colors shadow-sm">
            <div className="text-sage text-xs font-mono uppercase tracking-wider">Soil Reports</div>
            <div className="font-display text-3xl text-meadow font-bold">{stats?.analyses?.soil_reports ?? '—'}</div>
            <div className="text-sage text-xs">NLP processed reports</div>
          </div>
          <div className="bg-white border border-pebble rounded-xl p-4 space-y-1 hover:border-leaf/40 transition-colors shadow-sm">
            <div className="text-sage text-xs font-mono uppercase tracking-wider">Crop Analyses</div>
            <div className="font-display text-3xl text-charcoal font-bold">{stats?.analyses?.crop_analyses ?? '—'}</div>
            <div className="text-sage text-xs">PyTorch Deep Learning scans</div>
          </div>
        </div>

        {/* User & Role Management Section */}
        <div className="bg-white border border-pebble rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-pebble/60 pb-4">
            <div>
              <h2 className="font-display text-xl text-charcoal font-bold">User & Role Management</h2>
              <p className="text-sage text-xs mt-0.5">
                Manage system users, assign privileged Expert & Administrator roles, and activate/deactivate accounts.
              </p>
            </div>
            <button
              id="admin-create-user-btn"
              onClick={() => {
                setShowCreateModal(true)
                setErrorMsg(null)
              }}
              className="px-4 py-2 bg-forest text-cream font-semibold text-xs rounded-xl hover:bg-leaf transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>+</span>
              <span>Create New User (Expert / Admin)</span>
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex gap-1 bg-mist p-1 rounded-xl w-fit">
              {['all', 'farmer', 'expert', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-white text-charcoal shadow-sm'
                      : 'text-sage hover:text-charcoal'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-pebble bg-cream/40 text-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-leaf/40"
              />
              <span className="absolute left-2.5 top-2 text-sage text-xs">🔍</span>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-pebble">
            <table className="w-full text-left text-xs">
              <thead className="bg-mist text-sage font-mono uppercase tracking-wider border-b border-pebble">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Auth Provider</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pebble/60 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sage">
                      Loading user accounts...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sage">
                      No users found matching query.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const roleBadgeClass =
                      u.role === 'admin'
                        ? 'bg-rain/15 text-rain border-rain/30'
                        : u.role === 'expert'
                        ? 'bg-harvest/15 text-harvest border-harvest/30'
                        : 'bg-leaf/15 text-forest border-leaf/30'

                    const statusBadgeClass = u.is_active
                      ? 'bg-meadow/15 text-meadow border-meadow/30'
                      : 'bg-risk/15 text-risk border-risk/30'

                    const locStr = u.district && u.state
                      ? `${u.district}, ${u.state}`
                      : u.district || u.state || 'Not Set'

                    return (
                      <tr key={u.id} className="hover:bg-mist/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-charcoal">{u.full_name || u.display_name || 'Farmer'}</div>
                          <div className="text-sage text-[11px] font-mono">{u.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-mono uppercase tracking-wider font-semibold ${roleBadgeClass}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-sage text-[11px]">
                          {u.auth_provider || 'email'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase font-semibold ${statusBadgeClass}`}>
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-charcoal">
                          {locStr}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.email?.toLowerCase() === 'charankumarreddybantrothula@gmail.com' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rain bg-rain/10 border border-rain/30 px-2.5 py-1 rounded-lg font-semibold">
                                👑 Sole Administrator
                              </span>
                            ) : (
                              <>
                                {/* Edit Details Button */}
                                <button
                                  onClick={() => handleOpenEdit(u)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-rain/40 text-rain hover:bg-rain/10 flex items-center gap-1"
                                  title="Edit user details"
                                >
                                  <span>✏️</span>
                                  <span>Edit</span>
                                </button>

                                {/* Status Toggle Button */}
                                <button
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                                    u.is_active
                                      ? 'border-risk/30 text-risk hover:bg-risk/10'
                                      : 'border-forest/30 text-forest hover:bg-forest/10'
                                  }`}
                                >
                                  {u.is_active ? 'Deactivate' : 'Activate'}
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-risk/40 text-risk hover:bg-risk/10 flex items-center gap-1"
                                  title="Delete user from database"
                                >
                                  <span>🗑️</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* CREATE PRIVILEGED USER MODAL (EXPERT / ADMIN ONLY) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-pebble rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-pebble/60 pb-3">
              <h3 className="font-display text-lg text-charcoal font-bold">Create Privileged Account</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-sage hover:text-charcoal text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-risk/10 border border-risk/30 text-risk text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} autoComplete="off" className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-sage uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  id="admin-new-fullname"
                  name="privileged_user_name"
                  autoComplete="off"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Priya Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/40 text-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-leaf/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-sage uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  id="admin-new-email"
                  name="privileged_user_email"
                  autoComplete="off"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="expert@farmassist.ai"
                  className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/40 text-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-leaf/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-sage uppercase tracking-wider mb-1">
                  Role Assignment
                </label>
                <select
                  id="admin-new-role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-pebble bg-white text-charcoal text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="expert">Agricultural Expert (Review & approve advisories)</option>
                  <option value="farmer">Verified Farmer (Crop & advisory access)</option>
                </select>
                <p className="text-sage text-[11px] mt-1">
                  Administrator privileges are strictly and exclusively reserved for charankumarreddybantrothula@gmail.com.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-sage uppercase tracking-wider mb-1">
                  Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  id="admin-new-password"
                  name="privileged_user_password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/40 text-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-leaf/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-sage uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  id="admin-new-confirm-password"
                  name="privileged_user_confirm_password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-pebble bg-cream/40 text-charcoal text-xs focus:outline-none focus:ring-1 focus:ring-leaf/40"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-pebble text-charcoal rounded-xl text-xs font-medium hover:bg-mist transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="admin-create-submit-btn"
                  disabled={createLoading}
                  className="flex-1 py-2.5 bg-forest text-cream rounded-xl text-xs font-semibold hover:bg-leaf transition-colors shadow-sm cursor-pointer"
                >
                  {createLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SENSITIVE OPERATION CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-pebble rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-base text-charcoal font-bold">{confirmModal.title}</h3>
            <p className="text-sage text-xs leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2 border border-pebble text-charcoal rounded-xl text-xs font-medium hover:bg-mist cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2 bg-risk text-cream rounded-xl text-xs font-semibold hover:bg-risk/90 cursor-pointer shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
