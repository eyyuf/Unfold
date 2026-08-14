import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Compass, Bookmark, ChevronRight, Star, Heart, Brain, Leaf, Users, Dumbbell, Search, Sparkles } from 'lucide-react'
import { experimentService } from '@/services/experimentService'
import { SkeletonCard, Btn, ErrorBlock, Card, CategoryChip, Badge } from '@/components/common'
import { C } from '@/app/theme'
import type { Screen, UserData } from '@/types'

export default function ExperimentsPage({ setScreen }: { setScreen: (s: Screen) => void }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = queryClient.getQueryData<UserData | null>(['me'])

  const filters = [
    { label: 'All', color: C.t1 },
    { label: 'Creative', color: C.purple, Icon: Star },
    { label: 'Technical', color: C.blue, Icon: Brain },
    { label: 'Social', color: C.orange, Icon: Users },
    { label: 'Nature', color: C.acc, Icon: Leaf },
    { label: 'Service', color: C.teal, Icon: Heart },
    { label: 'Physical', color: C.amber, Icon: Dumbbell },
  ]

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['experiments', activeFilter, search],
    queryFn: () => experimentService.list({ category: activeFilter !== 'All' ? activeFilter.toLowerCase() : undefined, search }),
  })
  const { data: savedItems = [] } = useQuery({
    queryKey: ['saved-experiments'],
    queryFn: experimentService.getSaved,
    enabled: Boolean(user),
  })
  const savedSlugs = new Set(savedItems.map((item) => item.experiment.slug))
  const saveExperiment = useMutation({
    mutationFn: ({ slug, saved }: { slug: string; saved: boolean }) => experimentService.toggleSaved(slug, saved),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-experiments'] }),
  })
  const toggleSave = (event: React.MouseEvent, slug: string) => {
    event.stopPropagation()
    if (!user) {
      setScreen('login')
      return
    }
    saveExperiment.mutate({ slug, saved: savedSlugs.has(slug) })
  }
  const categoryStyle: Record<string, { color: string; Icon: React.ElementType }> = {
    Creative: { color: C.purple, Icon: Star }, Technical: { color: C.blue, Icon: Brain },
    Social: { color: C.orange, Icon: Users }, Nature: { color: C.acc, Icon: Leaf },
    Service: { color: C.teal, Icon: Heart }, Physical: { color: C.amber, Icon: Dumbbell },
  }
  const interests = user?.onboarding_answers?.interests ?? []
  const exps = data.map((item) => ({
    ...item, cat: item.category, days: item.duration_days, mins: item.minutes_per_day,
    desc: item.description, ...(categoryStyle[item.category] ?? { color: C.acc, Icon: Compass }),
  })).sort((a, b) => Number(interests.includes(b.category)) - Number(interests.includes(a.category)))
    .map((item, index) => ({ ...item, badge: index === 0 ? (interests.includes(item.category) ? 'Matches your interests' : 'Good first experiment') : undefined }))
  const openExperiment = (slug: string) => navigate(`/app/experiments/${slug}`)
  if (isLoading) return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <div className="skeleton" style={{ width: 200, height: 28, borderRadius: 8, marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
  if (error) return <ErrorBlock message="The experiment library could not be loaded." onRetry={() => refetch()} />

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }} className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: 32, marginBottom: 6 }}>Explore experiments</h1>
          <p style={{ fontSize: 15, color: C.t3 }}>Pick one that feels worth exploring. You can always try another after.</p>
        </div>
        {user && <Btn variant="ghost" size="sm" onClick={() => setScreen('saved')}><Bookmark size={15} /> Saved</Btn>}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={16} color={C.t4} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search experiments..." style={{
          width: '100%', padding: '11px 14px 11px 40px', borderRadius: 10,
          background: C.s1, border: `1px solid ${C.br}`, color: C.t1,
          fontFamily: 'inherit', fontSize: 15, outline: 'none',
          boxSizing: 'border-box',
        }} />
      </div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {filters.map(({ label, color, Icon }) => (
          <CategoryChip key={label} label={label} color={color} icon={Icon}
            active={activeFilter === label} onClick={() => setActiveFilter(label)} />
        ))}
      </div>

      {/* Recommended row */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.05em' }}>RECOMMENDED FOR YOU</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {exps.slice(0, 2).map(({ title, slug, cat, color, Icon, days, mins, desc, badge }) => (
            <Card key={title} accent onClick={() => openExperiment(slug)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, overflow: 'hidden', border: `1px solid ${color}44`, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <Icon size={21} color={color} strokeWidth={2} />
                  </div>
                  <Badge label={cat} color={color} />
                </div>
                 <button aria-label={`${savedSlugs.has(slug) ? 'Remove' : 'Save'} ${title}`} onClick={(event) => toggleSave(event, slug)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: savedSlugs.has(slug) ? C.acc : C.t4 }}><Bookmark size={15} fill={savedSlugs.has(slug) ? 'currentColor' : 'none'} /></button>
              </div>
              {badge && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.acc, marginBottom: 6, letterSpacing: '0.04em' }}><Sparkles size={12} /> {badge.toUpperCase()}</div>}
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
              <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.55, marginBottom: 14 }}>{desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: C.t4 }}>
                  <span>{days} days</span>
                  <span>·</span>
                  <span>{mins} min/day</span>
                </div>
                <ChevronRight size={15} color={C.acc} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* All experiments grid */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t4, letterSpacing: '0.05em', marginBottom: 14 }}>ALL EXPERIMENTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {exps.map(({ title, slug, cat, color, Icon, days, mins, desc }) => (
            <Card key={title} onClick={() => openExperiment(slug)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, overflow: 'hidden', border: `1px solid ${color}44`, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                    <Icon size={21} color={color} strokeWidth={2} />
                  </div>
                  <Badge label={cat} color={color} />
                </div>
                <button aria-label={`${savedSlugs.has(slug) ? 'Remove' : 'Save'} ${title}`} onClick={(event) => toggleSave(event, slug)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: savedSlugs.has(slug) ? C.acc : C.t4 }}><Bookmark size={15} fill={savedSlugs.has(slug) ? 'currentColor' : 'none'} /></button>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
              <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.55, marginBottom: 14 }}>{desc}</p>
              <div style={{ fontSize: 13, color: C.t4 }}>{days} days · {mins} min/day</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
