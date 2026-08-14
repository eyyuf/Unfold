import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart2, ChevronRight, Settings, Shield, Lock, Download, Trash2, Moon, Sun } from 'lucide-react'
import { authService } from '@/services/authService'
import { exportEvidencePdf } from '@/utils/exportEvidencePdf'
import { ConfirmModal, Btn, Card } from '@/components/common'
import { C, applyThemePreference } from '@/app/theme'
import { addToast } from '@/components/common/toast'
import type { Screen, ThemePreference } from '@/types'
import { StreakTracker } from '@/components/profile/StreakTracker'

export default function ProfilePage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem('unfold-theme') as ThemePreference | null) ?? 'dark')
  const [showConsents, setShowConsents] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const queryClient = useQueryClient()
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: authService.getCurrentUser })
  const { data: activity, isPending: activityLoading } = useQuery({
    queryKey: ['profile-activity'],
    queryFn: authService.getProfileActivity,
  })
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [reminderTime, setReminderTime] = useState(user?.reminder_time?.slice(0, 5) ?? '19:30')
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Africa/Nairobi')
  useEffect(() => {
    if (!user) return
    setDisplayName(user.display_name ?? '')
    setReminderTime(user.reminder_time?.slice(0, 5) ?? '19:30')
    setTimezone(user.timezone ?? 'Africa/Nairobi')
  }, [user])
  const updateProfile = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => { queryClient.setQueryData(['me'], data); addToast('Settings saved') },
  })
  const { data: consents = [] } = useQuery({
    queryKey: ['consent-history'],
    queryFn: authService.getConsentHistory,
    enabled: showConsents,
  })
  const exportData = useMutation({
    mutationFn: authService.exportUserData,
    onSuccess: exportEvidencePdf,
  })
  const deleteUser = useMutation({
    mutationFn: authService.deleteAccount,
    onSuccess: () => { queryClient.clear(); setScreen('landing') },
  })
  const logoutUser = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => { queryClient.clear(); setScreen('landing') },
  })
  const chooseTheme = (preference: ThemePreference) => {
    setTheme(preference)
    localStorage.setItem('unfold-theme', preference)
    applyThemePreference(preference)
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 28, letterSpacing: '-0.02em' }}>Profile & settings</h1>

      {/* Avatar */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${C.purple}44, ${C.blue}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: C.purple }}>{(user?.display_name || user?.email || 'U')[0].toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.display_name || 'Explorer'}</div>
            <div style={{ color: C.t4, fontSize: 14 }}>{user?.email}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 10, marginBottom: 16 }}>
          <input aria-label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" style={{ background: C.s2, border: `1px solid ${C.br}`, color: C.t1, borderRadius: 9, padding: '10px 12px', font: 'inherit' }} />
          <Btn size="sm" disabled={updateProfile.isPending} onClick={() => updateProfile.mutate({ display_name: displayName })}>Save name</Btn>
        </div>
        {[
          { label: 'Display name', value: user?.display_name || 'Not set' },
          { label: 'Email', value: user?.email || '' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${C.br}` }}>
            <span style={{ fontSize: 14, color: C.t3 }}>{label}</span>
            <span style={{ fontSize: 14, color: C.t1 }}>{value}</span>
          </div>
        ))}
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: `1px solid ${C.br}`, color: C.t3, fontSize: 14 }}>
          Timezone
          <select value={timezone} onChange={(event) => { setTimezone(event.target.value); updateProfile.mutate({ timezone: event.target.value }) }} style={{ background: C.s2, color: C.t1, border: `1px solid ${C.br}`, borderRadius: 8, padding: 8 }}>
            {['Africa/Nairobi', 'Africa/Lagos', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'].map((zone) => <option key={zone}>{zone}</option>)}
          </select>
        </label>
      </Card>

      <StreakTracker activity={activity} loading={activityLoading} />

      {/* Reminders */}
      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Reminders</h2>
        {[
          { label: 'Enable reminders', field: 'reminders_enabled', active: Boolean(user?.reminders_enabled) },
          { label: 'Send by email', field: 'email_reminders_enabled', active: Boolean(user?.email_reminders_enabled) },
        ].map(({ label, field, active }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: C.t2 }}>{label}</span>
            <button role="switch" aria-checked={active} aria-label={label} onClick={() => updateProfile.mutate({ [field]: !active })} style={{ width: 44, height: 24, padding: 0, border: 0, borderRadius: 12, background: active ? C.acc : C.s2, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 3, left: active ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: C.t1, transition: 'left 0.2s' }} />
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${C.br}` }}>
          <span style={{ fontSize: 14, color: C.t2 }}>Preferred time</span>
          <input aria-label="Preferred reminder time" type="time" value={reminderTime} onChange={(event) => { setReminderTime(event.target.value); updateProfile.mutate({ reminder_time: event.target.value }) }} style={{ background: C.s2, border: `1px solid ${C.br}`, color: C.t1, borderRadius: 8, padding: 8 }} />
        </div>
        <p style={{ color: C.t4, fontSize: 12, margin: '12px 0 0' }}>Reminders use {timezone}. A preview: “Today’s experiment is ready when you are.”</p>
        {updateProfile.error && <p role="alert" style={{ color: C.red, fontSize: 13 }}>{updateProfile.error.message}</p>}
      </Card>

      {/* Appearance */}
      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Appearance</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {([['dark', 'Dark', Moon], ['light', 'Light', Sun], ['system', 'System', Settings]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => chooseTheme(id)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${theme === id ? C.accB : C.br}`,
              background: theme === id ? C.accS : C.s1, color: theme === id ? C.acc : C.t3,
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Privacy */}
      <Card style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={16} color={C.t4} /> Privacy & data
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: C.s2 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.t2, fontSize: 14 }}><BarChart2 size={15} color={C.t4} />Optional analytics</span>
            <button role="switch" aria-checked={Boolean(user?.analytics_consent)} aria-label="Optional analytics consent" onClick={() => updateProfile.mutate({ analytics_consent: !user?.analytics_consent })} style={{ width: 44, height: 24, padding: 0, border: 0, borderRadius: 12, background: user?.analytics_consent ? C.acc : C.bg2, position: 'relative', cursor: 'pointer' }}>
              <span style={{ position: 'absolute', top: 3, left: user?.analytics_consent ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: C.t1, transition: 'left 0.2s' }} />
            </button>
          </div>
          <button onClick={() => setShowConsents((visible) => !visible)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.s2, border: 'none', color: C.t2, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Shield size={15} color={C.t4} />View consent history</span>
            <ChevronRight size={14} color={C.t4} style={{ transform: showConsents ? 'rotate(90deg)' : undefined }} />
          </button>
          {showConsents && <div style={{ background: C.bg2, borderRadius: 10, padding: '4px 14px' }}>
            {!consents.length && <p style={{ color: C.t4, fontSize: 13 }}>No consent records found.</p>}
            {consents.map((record) => <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.br}`, fontSize: 12 }}>
              <span style={{ color: C.t2 }}>{record.kind}: {record.granted ? 'Granted' : 'Declined'}</span>
              <span style={{ color: C.t4 }}>{new Date(record.created_at).toLocaleDateString()}</span>
            </div>)}
          </div>}
          <button disabled={exportData.isPending} onClick={() => exportData.mutate()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: C.s2, border: 'none', color: C.t2, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Download size={15} color={C.t4} />{exportData.isPending ? 'Preparing PDF…' : 'Export as PDF'}</span>
            <ChevronRight size={14} color={C.t4} />
          </button>
          <button disabled={deleteUser.isPending} onClick={() => setShowDeleteModal(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: `1px solid rgba(239,68,68,0.2)`, color: C.red, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Trash2 size={15} />Delete account</span>
            <ChevronRight size={14} />
          </button>
          {(exportData.error || deleteUser.error) && <p role="alert" style={{ color: C.red, fontSize: 13 }}>{(exportData.error || deleteUser.error)?.message}</p>}
        </div>
      </Card>
      <Btn variant="ghost" full disabled={logoutUser.isPending} onClick={() => logoutUser.mutate()}>Log out</Btn>

      <ConfirmModal
        open={showDeleteModal}
        title="Delete your account?"
        message="This permanently deletes your account and all evidence. This action cannot be undone."
        confirmLabel="Delete account permanently"
        confirmVariant="danger"
        onConfirm={() => { if (deleteConfirmation === 'DELETE') { setShowDeleteModal(false); deleteUser.mutate() } }}
        onCancel={() => { setShowDeleteModal(false); setDeleteConfirmation('') }}
      >
        <label style={{ display: 'block', color: C.t2, fontSize: 14 }}>
          <span style={{ display: 'block', marginBottom: 7 }}>Type DELETE to confirm</span>
          <input value={deleteConfirmation} onChange={e => setDeleteConfirmation(e.target.value)} placeholder="DELETE" style={{ width: '100%', background: C.s2, color: C.t1, border: `1px solid ${deleteConfirmation === 'DELETE' ? C.red : C.br}`, borderRadius: 10, padding: '12px 14px', font: 'inherit' }} />
        </label>
      </ConfirmModal>
    </div>
  )
}
