import React from 'react'
import { render, screen } from '@testing-library/react'
import { useIsTruncated } from './useIsTruncated'

const Probe: React.FC<{ text: string }> = ({ text }) => {
  const [ref, isTruncated] = useIsTruncated<HTMLDivElement>([text])
  return (
    <div ref={ref} data-testid="probe">
      {text}
      <span data-testid="state">{String(isTruncated)}</span>
    </div>
  )
}

const setWidths = (scrollWidth: number, clientWidth: number) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    value: scrollWidth,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: clientWidth,
  })
}

describe('useIsTruncated', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('is false when content fits its box', () => {
    setWidths(100, 100)
    render(<Probe text="short" />)
    expect(screen.getByTestId('state')).toHaveTextContent('false')
  })

  it('is true when content overflows its box', () => {
    setWidths(300, 100)
    render(<Probe text="a very long piece of text that overflows" />)
    expect(screen.getByTestId('state')).toHaveTextContent('true')
  })

  it('re-measures when a dependency changes', () => {
    setWidths(100, 100)
    const { rerender } = render(<Probe text="short" />)
    expect(screen.getByTestId('state')).toHaveTextContent('false')

    setWidths(300, 100)
    rerender(<Probe text="now this is a much longer string" />)
    expect(screen.getByTestId('state')).toHaveTextContent('true')
  })
})
