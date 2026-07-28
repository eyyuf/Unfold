import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"

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
  const user = {
    id: 1,
    email: "ari@example.com",
    display_name: "Ari",
    timezone: "Africa/Nairobi",
    reminders_enabled: false,
    email_reminders_enabled: true,
    analytics_consent: false,
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith("/auth/me/")) {
        return new Response(JSON.stringify(user), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      if (url.endsWith("/auth/consents/")) {
        return new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      }
      return new Response(JSON.stringify({ detail: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }),
  )
})

describe("Unfold navigation and account forms", () => {
  it("connects Help and Settings sidebar navigation", async () => {
    renderApp("/app/help")
    expect(
      await screen.findByRole("heading", { name: "How can we help?" }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Settings" }))
    expect(
      await screen.findByRole("heading", { name: "Profile & settings" }),
    ).toBeInTheDocument()
  })

  it("requires password confirmation and terms acceptance during registration", async () => {
    renderApp("/register")
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new@example.com" },
    })
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "a-secure-password" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument()
      expect(
        screen.getByText("You must accept the Terms and Privacy Policy"),
      ).toBeInTheDocument()
    })
  })
})
