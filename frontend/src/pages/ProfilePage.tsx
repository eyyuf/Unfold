import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jsPDF } from 'jspdf'
import { BarChart2, ChevronRight, Settings, Shield, Lock, Download, Trash2, Moon, Sun } from 'lucide-react'
import { authService } from '@/services/authService'
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
    onSuccess: (data) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210, M = 20
      const contentW = W - M * 2
      let y = 0

      const ensurePage = (need: number) => {
        if (y + need > 277) { doc.addPage(); y = M; }
      }

      // ── Helper: draw a horizontal rule ──
      const hr = () => {
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.3)
        doc.line(M, y, W - M, y)
        y += 6
      }

      // ── Helper: draw colored bar ──
      const bar = (x: number, _w: number, value: number, maxW: number, color: [number, number, number]) => {
        doc.setFillColor(240, 240, 240)
        doc.roundedRect(x, y, maxW, 4, 2, 2, 'F')
        doc.setFillColor(...color)
        doc.roundedRect(x, y, Math.max(2, (value / 100) * maxW), 4, 2, 2, 'F')
      }

      // ══════════════ COVER ══════════════
      doc.setFillColor(9, 9, 11)
      doc.rect(0, 0, W, 297, 'F')

      // Green accent circle
      doc.setFillColor(34, 197, 94)
      doc.circle(W / 2, 100, 18, 'F')
      doc.setFillColor(9, 9, 11)
      doc.circle(W / 2, 100, 14, 'F')
      doc.setFillColor(34, 197, 94)
      doc.circle(W / 2, 100, 4, 'F')

      doc.setTextColor(250, 250, 250)
      doc.setFontSize(32)
      doc.text('Unfold', W / 2, 138, { align: 'center' })
      doc.setFontSize(12)
      doc.setTextColor(161, 161, 170)
      doc.text('Your Personal Evidence Report', W / 2, 150, { align: 'center' })

      doc.setFontSize(10)
      doc.setTextColor(113, 113, 122)
      const profile = data.profile || {}
      doc.text(profile.display_name || profile.email || 'Explorer', W / 2, 175, { align: 'center' })
      doc.text(`Exported ${new Date(data.exported_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, W / 2, 182, { align: 'center' })

      const experiments = data.experiments || []
      const completed = experiments.filter((e: any) => e.status === 'completed')
      doc.setTextColor(161, 161, 170)
      doc.text(`${completed.length} experiments completed  •  ${experiments.reduce((s: number, e: any) => s + (e.checkin_count || 0), 0)} total check-ins`, W / 2, 200, { align: 'center' })

      // ══════════════ EXPERIMENTS ══════════════
      experiments.forEach((exp: any, idx: number) => {
        doc.addPage()
        y = M

        // Header bar
        doc.setFillColor(24, 24, 27)
        doc.roundedRect(M, y, contentW, 32, 3, 3, 'F')

        doc.setFontSize(16)
        doc.setTextColor(250, 250, 250)
        doc.text(exp.experiment?.title || `Experiment ${idx + 1}`, M + 10, y + 13)

        doc.setFontSize(9)
        doc.setTextColor(161, 161, 170)
        const meta = [exp.experiment?.category, `${exp.experiment?.duration_days || '?'} days`, exp.status].filter(Boolean).join('  •  ')
        doc.text(meta, M + 10, y + 23)

        // Fit signal badge
        const fit = exp.fit_signal || 0
        const fitColor: [number, number, number] = fit >= 70 ? [34, 197, 94] : fit >= 45 ? [245, 158, 11] : [161, 161, 170]
        doc.setFillColor(...fitColor)
        doc.roundedRect(W - M - 30, y + 6, 20, 20, 3, 3, 'F')
        doc.setFontSize(14)
        doc.setTextColor(9, 9, 11)
        doc.text(`${fit}%`, W - M - 20, y + 19, { align: 'center' })

        y += 40

        // Start date & strongest signal
        doc.setFontSize(10)
        doc.setTextColor(100, 100, 110)
        doc.text(`Started: ${exp.start_date || 'N/A'}`, M, y)
        doc.text(`Strongest signal: ${exp.strongest_signal || 'N/A'}`, M + 80, y)
        y += 10

        // Dimension breakdown
        if (exp.dimensions) {
          doc.setFontSize(11)
          doc.setTextColor(60, 60, 68)
          doc.text('Dimension Breakdown', M, y)
          y += 8

          Object.entries(exp.dimensions as Record<string, number>).forEach(([dim, val]) => {
            ensurePage(12)
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 110)
            doc.text(dim, M, y + 3)
            doc.text(`${val}%`, M + 42, y + 3)
            const barColor: [number, number, number] = val >= 70 ? [34, 197, 94] : val >= 45 ? [245, 158, 11] : [161, 161, 170]
            bar(M + 52, contentW - 52, val, contentW - 52, barColor)
            y += 9
          })
          y += 4
        }

        // Summary
        if (exp.summary) {
          ensurePage(25)
          hr()
          doc.setFontSize(10)
          doc.setTextColor(60, 60, 68)
          doc.text('Final Reflection', M, y)
          y += 6
          doc.setFontSize(9)
          doc.setTextColor(80, 80, 88)
          const lines = doc.splitTextToSize(exp.summary, contentW)
          doc.text(lines, M, y)
          y += lines.length * 4.5 + 4
        }

        // Reason
        if (exp.reason) {
          ensurePage(20)
          doc.setFontSize(10)
          doc.setTextColor(60, 60, 68)
          doc.text('Why you started', M, y)
          y += 6
          doc.setFontSize(9)
          doc.setTextColor(80, 80, 88)
          const lines = doc.splitTextToSize(exp.reason, contentW)
          doc.text(lines, M, y)
          y += lines.length * 4.5 + 4
        }

        // Check-ins table
        const checkins = exp.checkins || []
        if (checkins.length) {
          ensurePage(20)
          hr()
          doc.setFontSize(10)
          doc.setTextColor(60, 60, 68)
          doc.text(`Check-ins (${checkins.length})`, M, y)
          y += 7

          // Table header
          doc.setFillColor(245, 245, 248)
          doc.rect(M, y, contentW, 7, 'F')
          doc.setFontSize(8)
          doc.setTextColor(100, 100, 110)
          const cols = [M + 2, M + 22, M + 42, M + 62, M + 82, M + 102]
          const headers = ['Day', 'Energy', 'Curiosity', 'Meaning', 'Difficulty', 'Note']
          headers.forEach((h, i) => doc.text(h, cols[i], y + 5))
          y += 9

          checkins.forEach((ci: any) => {
            ensurePage(8)
            doc.setFontSize(8)
            doc.setTextColor(70, 70, 78)
            doc.text(String(ci.day_number || ''), cols[0], y + 3)
            doc.text(`${ci.energy}/5`, cols[1], y + 3)
            doc.text(`${ci.curiosity}/5`, cols[2], y + 3)
            doc.text(`${ci.meaning}/5`, cols[3], y + 3)
            doc.text(`${ci.difficulty}/5`, cols[4], y + 3)
            const note = ci.notes ? (ci.notes.length > 30 ? ci.notes.slice(0, 28) + '…' : ci.notes) : '—'
            doc.text(note, cols[5], y + 3)

            doc.setDrawColor(235, 235, 238)
            doc.setLineWidth(0.2)
            doc.line(M, y + 5, W - M, y + 5)
            y += 7
          })
          y += 4
        }
      })

      // ══════════════ SAVED EXPERIMENTS ══════════════
      const saved = data.saved_experiments || []
      if (saved.length) {
        doc.addPage()
        y = M
        doc.setFontSize(14)
        doc.setTextColor(40, 40, 44)
        doc.text('Saved Experiments', M, y)
        y += 10
        saved.forEach((s: any) => {
          ensurePage(10)
          doc.setFontSize(10)
          doc.setTextColor(60, 60, 68)
          doc.text(`• ${s.experiment?.title || 'Untitled'}`, M, y)
          doc.setTextColor(140, 140, 148)
          doc.text(s.experiment?.category || '', M + 120, y)
          y += 7
        })
      }

      // ══════════════ FOOTER on every page ══════════════
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(180, 180, 185)
        doc.text('Unfold — Evidence-based self-discovery', M, 290)
        doc.text(`Page ${i} of ${pageCount}`, W - M, 290, { align: 'right' })
      }

      doc.save(`unfold-report-${new Date().toISOString().slice(0, 10)}.pdf`)
      addToast('PDF report downloaded')
    },
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
