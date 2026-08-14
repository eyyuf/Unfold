import { useState } from 'react'
import { Badge } from '@/components/common'
import { C } from '@/app/theme'
import type { EvidenceNode } from '@/types'

export function EvidenceMap({
  nodes,
  categoryColors,
  onNodeClick,
}: {
  nodes: EvidenceNode[]
  categoryColors: Record<string, string>
  onNodeClick: (id: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const W = 720,
    H = 320,
    PAD = 60

  // ── Deterministic force-like layout ──
  // Spread nodes in a circle, then push apart nodes that share connections
  const positioned = (() => {
    if (!nodes.length) return []
    const count = nodes.length
    // Start with even circular distribution
    const pts = nodes.map((n, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2
      const rx = (W - PAD * 2) * 0.38
      const ry = (H - PAD * 2) * 0.38
      return {
        ...n,
        x: W / 2 + Math.cos(angle) * rx,
        y: H / 2 + Math.sin(angle) * ry,
      }
    })

    // Simple repulsion iterations to avoid overlap
    for (let iter = 0; iter < 30; iter++) {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[j].x - pts[i].x
          const dy = pts[j].y - pts[i].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = 90
          if (dist < minDist && dist > 0) {
            const force = ((minDist - dist) / dist) * 0.3
            pts[i].x -= dx * force
            pts[i].y -= dy * force
            pts[j].x += dx * force
            pts[j].y += dy * force
          }
        }
        // Clamp to bounds
        pts[i].x = Math.max(PAD, Math.min(W - PAD, pts[i].x))
        pts[i].y = Math.max(PAD, Math.min(H - PAD, pts[i].y))
      }
    }
    return pts
  })()

  // ── Build edges ──
  // Solid green line = same strongest_signal, dashed gray = same category
  const edges: { from: number; to: number; type: 'signal' | 'category' }[] = []
  for (let i = 0; i < positioned.length; i++) {
    for (let j = i + 1; j < positioned.length; j++) {
      if (positioned[i].strongest_signal === positioned[j].strongest_signal) {
        edges.push({ from: i, to: j, type: 'signal' })
      } else if (positioned[i].category === positioned[j].category) {
        edges.push({ from: i, to: j, type: 'category' })
      }
    }
  }

  const nodeRadius = (fit: number) => Math.max(6, Math.min(14, fit / 8))

  if (!positioned.length)
    return (
      <p style={{ color: C.t4, fontSize: 14 }}>Complete experiments to build your evidence map.</p>
    )

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          <radialGradient id="em-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.acc} stopOpacity="0.4" />
            <stop offset="100%" stopColor={C.acc} stopOpacity="0" />
          </radialGradient>
          <filter id="em-shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Background grid dots */}
        {Array.from({ length: 12 }).map((_, i) =>
          Array.from({ length: 6 }).map((_, j) => (
            <circle
              key={`g-${i}-${j}`}
              cx={30 + i * 60}
              cy={20 + j * 55}
              r={1}
              fill="rgba(63,63,70,0.2)"
            />
          )),
        )}

        {/* Edges */}
        {edges.map(({ from, to, type }, i) => {
          const a = positioned[from],
            b = positioned[to]
          const isHighlighted = hovered !== null && (hovered === from || hovered === to)
          const baseOpacity = isHighlighted
            ? 0.7
            : hovered !== null
              ? 0.1
              : type === 'signal'
                ? 0.4
                : 0.2
          return (
            <line
              key={`e-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={type === 'signal' ? 'rgba(34,197,94,0.6)' : 'rgba(63,63,70,0.5)'}
              strokeWidth={type === 'signal' ? 1.8 : 1}
              strokeDasharray={type === 'category' ? '6 4' : undefined}
              opacity={baseOpacity}
              style={{ transition: 'opacity 0.25s' }}
            />
          )
        })}

        {/* Nodes */}
        {positioned.map((node, i) => {
          const color = categoryColors[node.category] ?? C.acc
          const r = nodeRadius(node.fit_signal)
          const isHovered = hovered === i
          const dimmed =
            hovered !== null &&
            !isHovered &&
            !edges.some(
              (e) => (e.from === hovered && e.to === i) || (e.to === hovered && e.from === i),
            )
          return (
            <g
              key={node.id}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onNodeClick(node.id)}
              style={{ cursor: 'pointer', transition: 'opacity 0.25s' }}
              opacity={dimmed ? 0.25 : 1}
            >
              {/* Outer glow */}
              <circle
                cx={node.x}
                cy={node.y}
                r={r * 3}
                fill={`${color}10`}
                style={{ transition: 'r 0.2s' }}
              />
              {isHovered && <circle cx={node.x} cy={node.y} r={r * 4} fill={`${color}08`} />}

              {/* Core circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isHovered ? r * 1.3 : r}
                fill={color}
                style={{ transition: 'r 0.2s', filter: isHovered ? 'url(#em-shadow)' : undefined }}
              />

              {/* Twinkle ring */}
              <circle
                cx={node.x}
                cy={node.y}
                r={r * 1.5}
                fill="none"
                stroke={color}
                strokeWidth={0.8}
                opacity={0.3}
                style={{ animation: `twinkle ${2.5 + i * 0.4}s ease-in-out infinite` }}
              />

              {/* Label */}
              <text
                x={node.x}
                y={node.y + r + 16}
                textAnchor="middle"
                fill={C.t2}
                fontSize={11}
                fontWeight={600}
                fontFamily="Manrope, sans-serif"
              >
                {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
              </text>
              <text
                x={node.x}
                y={node.y + r + 30}
                textAnchor="middle"
                fill={C.t4}
                fontSize={10}
                fontWeight={600}
                fontFamily="Manrope, sans-serif"
              >
                {node.fit_signal}% fit
              </text>
            </g>
          )
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered !== null && positioned[hovered] && (
        <div
          className="glass scale-in"
          style={{
            position: 'absolute',
            left: Math.min(positioned[hovered].x, W - 200),
            top: Math.max(0, positioned[hovered].y - 90),
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 12,
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: C.t1 }}>
            {positioned[hovered].label}
          </div>
          <div style={{ color: C.t3, marginBottom: 2 }}>
            <Badge
              label={positioned[hovered].category}
              color={categoryColors[positioned[hovered].category] ?? C.acc}
            />
          </div>
          <div style={{ color: C.t3, marginTop: 6 }}>
            Fit signal:{' '}
            <span style={{ color: C.acc, fontWeight: 700 }}>{positioned[hovered].fit_signal}%</span>
          </div>
          <div style={{ color: C.t4, marginTop: 2 }}>
            Strongest: {positioned[hovered].strongest_signal}
          </div>
        </div>
      )}
    </div>
  )
}
