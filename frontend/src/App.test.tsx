import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const user = {
  id: 1,
  email: 'ari@example.com',
  display_name: 'Ari',
  timezone: 'Africa/Nairobi',
  reminders_enabled: false,
  email_reminders_enabled: true,
  analytics_consent: false,
}

const completedToday = {
  id: 10,
  start_date: '2026-08-14',
  experiment: {
    id: 2,
    category: 'Creative',
    title: 'Photography Walk',
    slug: 'photography-walk',
    description: 'Notice the world through a camera.',
    duration_days: 7,
    minutes_per_day: 20,
    daily_tasks: [
      { day: 1, title: 'Notice details', instructions: 'Take a short photography walk.' },
    ],
  },
  checkin_count: 1,
  current_day: 1,
  completed_days: [1],
  today_checkin_complete: true,
  can_check_in_today: false,
  can_complete: false,
  next_checkin_date: '2026-08-15',
  recent_checkins: [
    {
      day: 1,
      notes: 'I noticed more detail.',
      enjoyment: 5,
      energy: 4,
      curiosity: 5,
      meaning: 4,
      desire_to_continue: 5,
    },
  ],
}

function mockAuthenticatedApi(activeExperiment: typeof completedToday | null = null) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/auth/me/')) {
        return new Response(JSON.stringify(user), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (url.endsWith('/auth/consents/')) {
        return new Response('[]', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      if (url.endsWith('/user-experiments/active/')) {
        return new Response(JSON.stringify(activeExperiment), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ detail: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }),
  )
}

function renderApp(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockAuthenticatedApi()
})

describe('Unfold navigation and account forms', () => {
  it('connects Help and Settings sidebar navigation', async () => {
    renderApp('/app/help')
    expect(await screen.findByRole('heading', { name: 'How can we help?' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(await screen.findByRole('heading', { name: 'Profile & settings' })).toBeInTheDocument()
  })

  it('requires password confirmation and terms acceptance during registration', async () => {
    renderApp('/register')
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'new@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'a-secure-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
      expect(screen.getByText('You must accept the Terms and Privacy Policy')).toBeInTheDocument()
    })
  })

  it('requires authentication before opening product screens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('null', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )
    renderApp('/app/explore')

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })

  it("shows real calendar progress and disables another check-in after today's completion", async () => {
    mockAuthenticatedApi(completedToday)
    renderApp('/app')

    expect(await screen.findByText("Today's check-in is complete.")).toBeInTheDocument()
    expect(screen.getByText('Day 1 of 7')).toBeInTheDocument()
    expect(screen.getByText('1 of 7 check-ins completed')).toBeInTheDocument()
    expect(screen.getByText(/next check-in will be available tomorrow/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: "Begin today's task" })).not.toBeInTheDocument()
  })

  it('blocks direct check-in navigation when today is already complete', async () => {
    mockAuthenticatedApi(completedToday)
    renderApp('/app/check-in')

    expect(
      await screen.findByRole('heading', { name: "Today's check-in is complete." }),
    ).toBeInTheDocument()
    expect(screen.getByText(/next check-in will be available tomorrow/i)).toBeInTheDocument()
    expect(screen.queryByText('How enjoyable was it?')).not.toBeInTheDocument()
  })

  it('shows the saved state without immediately offering Day 2', async () => {
    mockAuthenticatedApi(completedToday)
    renderApp('/app/check-in/complete')

    expect(
      await screen.findByRole('heading', { name: "Today's check-in is complete." }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Day 1 of 7 · 1 check-in completed/)).toBeInTheDocument()
    expect(screen.getByText(/next check-in will be available tomorrow/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Day 2/i })).not.toBeInTheDocument()
  })
})
