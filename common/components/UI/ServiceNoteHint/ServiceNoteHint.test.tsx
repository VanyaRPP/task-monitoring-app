import { fireEvent, render, screen } from '@testing-library/react'
import ServiceNoteHint from './index'

describe('ServiceNoteHint', () => {
  it('renders nothing without a note', () => {
    const { container, rerender } = render(<ServiceNoteHint />)
    expect(container).toBeEmptyDOMElement()
    rerender(<ServiceNoteHint note="   " />)
    expect(container).toBeEmptyDOMElement()
  })

  it('hides the text until the indicator is used', () => {
    render(<ServiceNoteHint note="Remember the contract" />)
    expect(screen.getByTestId('service-note-indicator')).toBeInTheDocument()
    expect(screen.queryByText('Remember the contract')).not.toBeInTheDocument()
  })

  it('opens on click (touch) and shows multi-line text', async () => {
    render(<ServiceNoteHint note={'Line 1\nLine 2'} />)
    fireEvent.click(screen.getByTestId('service-note-indicator'))
    const content = await screen.findByTestId('service-note-content')
    expect(content.textContent).toBe('Line 1\nLine 2')
    expect(content).toHaveStyle({ whiteSpace: 'pre-wrap' })
  })

  it('opens on hover', async () => {
    render(<ServiceNoteHint note="Hover text" />)
    fireEvent.mouseEnter(screen.getByTestId('service-note-indicator'))
    expect(await screen.findByText('Hover text')).toBeInTheDocument()
  })
})
