import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import TableFilterLink from '.'

jest.mock('antd', () => {
  const React = require('react')
  const actual = jest.requireActual('antd')
  return {
    ...actual,
    Tooltip: ({
      title,
      children,
    }: {
      title: string
      children: React.ReactNode
    }) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement('span', { 'data-testid': 'tooltip-title' }, title),
        children
      ),
  }
})

describe('TableFilterLink', () => {
  const setFilters = jest.fn()

  const defaultProps = {
    label: 'Test Label',
    filterKey: 'domain',
    filterId: 'domain-id-1',
    filters: {},
    setFilters,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the passed label', () => {
    render(<TableFilterLink {...defaultProps} />)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('calls setFilters with correct filter key and id on click', () => {
    render(<TableFilterLink {...defaultProps} />)
    fireEvent.click(screen.getByText('Test Label'))
    expect(setFilters).toHaveBeenCalledWith({ domain: ['domain-id-1'] })
  })

  it('merges new filter with existing filters on click', () => {
    render(
      <TableFilterLink {...defaultProps} filters={{ company: ['company-1'] }} />
    )
    fireEvent.click(screen.getByText('Test Label'))
    expect(setFilters).toHaveBeenCalledWith({
      company: ['company-1'],
      domain: ['domain-id-1'],
    })
  })

  it('handles undefined filters without throwing', () => {
    render(<TableFilterLink {...defaultProps} filters={undefined} />)
    fireEvent.click(screen.getByText('Test Label'))
    expect(setFilters).toHaveBeenCalledWith({ domain: ['domain-id-1'] })
  })

  it('shows default tooltip title "Додати в фільтри"', () => {
    render(<TableFilterLink {...defaultProps} />)
    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(
      'Додати в фільтри'
    )
  })

  it('shows custom tooltip title when provided', () => {
    render(
      <TableFilterLink {...defaultProps} tooltipTitle="Custom Tooltip Text" />
    )
    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(
      'Custom Tooltip Text'
    )
  })

  it('applies an explicit pixel max-width when provided', () => {
    render(<TableFilterLink {...defaultProps} maxWidth={140} />)
    expect(screen.getByText('Test Label')).toHaveStyle({ maxWidth: '140px' })
  })

  it('has no inline max-width by default (relies on the ellipsis class)', () => {
    render(<TableFilterLink {...defaultProps} />)
    expect(screen.getByText('Test Label')).not.toHaveAttribute('style')
  })

  describe('truncation', () => {
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

    afterEach(() => {
      delete (HTMLElement.prototype as any).scrollWidth
      delete (HTMLElement.prototype as any).clientWidth
    })

    it('shows only the action hint when the label fits', () => {
      setWidths(100, 100)
      render(<TableFilterLink {...defaultProps} />)
      const tooltip = screen.getByTestId('tooltip-title')
      expect(tooltip).toHaveTextContent('Додати в фільтри')
      expect(tooltip).not.toHaveTextContent('Test Label')
    })

    it('includes the full label alongside the hint when truncated', () => {
      setWidths(300, 100)
      render(
        <TableFilterLink
          {...defaultProps}
          label="Товариство з обмеженою відповідальністю Інноваційні рішення"
        />
      )
      const tooltip = screen.getByTestId('tooltip-title')
      expect(tooltip).toHaveTextContent(
        'Товариство з обмеженою відповідальністю Інноваційні рішення'
      )
      expect(tooltip).toHaveTextContent('Додати в фільтри')
    })
  })

  it('works for company filter key', () => {
    const companySetFilters = jest.fn()
    render(
      <TableFilterLink
        label="My Company"
        filterKey="company"
        filterId="company-id-1"
        filters={{}}
        setFilters={companySetFilters}
      />
    )
    fireEvent.click(screen.getByText('My Company'))
    expect(companySetFilters).toHaveBeenCalledWith({
      company: ['company-id-1'],
    })
  })

  it('works for service filter key', () => {
    const serviceSetFilters = jest.fn()
    render(
      <TableFilterLink
        label="My Service"
        filterKey="service"
        filterId="service-id-1"
        filters={{}}
        setFilters={serviceSetFilters}
      />
    )
    fireEvent.click(screen.getByText('My Service'))
    expect(serviceSetFilters).toHaveBeenCalledWith({
      service: ['service-id-1'],
    })
  })
})
