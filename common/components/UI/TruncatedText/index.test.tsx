import React from 'react'
import { render, screen } from '@testing-library/react'
import { TruncatedText } from '.'

jest.mock('antd', () => {
  const React = require('react')
  const actual = jest.requireActual('antd')
  return {
    ...actual,
    Tooltip: ({
      title,
      children,
    }: {
      title: React.ReactNode
      children: React.ReactNode
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'tooltip' },
        React.createElement('span', { 'data-testid': 'tooltip-title' }, title),
        children
      ),
  }
})

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

describe('TruncatedText', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('renders a short name in full with no tooltip', () => {
    setWidths(100, 100)
    render(<TruncatedText text="Google" />)

    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
  })

  it('truncates a long name and exposes the full value via tooltip', () => {
    setWidths(400, 100)
    const longName =
      'Товариство з обмеженою відповідальністю "Інноваційні рішення для бізнесу"'
    render(<TruncatedText text={longName} />)

    expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(longName)
    expect(screen.getAllByText(longName)).toHaveLength(2)
  })

  it('applies ellipsis styling to the rendered element', () => {
    setWidths(100, 100)
    render(<TruncatedText text="Google" maxWidth={160} />)

    const el = screen.getByText('Google')
    expect(el).toHaveStyle({ maxWidth: '160px' })
  })

  it('renders as the requested tag', () => {
    setWidths(100, 100)
    render(<TruncatedText text="Google" as="p" />)

    expect(screen.getByText('Google').tagName).toBe('P')
  })
})
