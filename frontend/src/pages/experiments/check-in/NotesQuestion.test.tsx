import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NotesQuestion } from './NotesQuestion'

describe('NotesQuestion', () => {
  it('keeps the note visible while presenting pending and error states accessibly', () => {
    render(
      <NotesQuestion
        notes="A useful observation"
        isPending
        error={new Error('The check-in could not be saved.')}
        onChange={vi.fn()}
        onSkip={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox')).toHaveValue('A useful observation')
    expect(screen.getByText('20 / 500')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('The check-in could not be saved.')
  })
})
