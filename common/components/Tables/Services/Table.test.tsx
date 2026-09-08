import React from 'react'
import { render, screen } from '@testing-library/react'
import ServicesTable from './Table'
import { useDeleteServiceMutation } from '@common/api/serviceApi/service.api'

jest.mock('@common/api/serviceApi/service.api', () => ({
  useDeleteServiceMutation: jest.fn(),
}))

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ pathname: '/dashboard' })),
}))

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
        React.Fragment,
        null,
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

const baseProps = {
  setCurrentService: jest.fn(),
  setServiceActions: jest.fn(),
  serviceActions: { edit: false, preview: false },
  isLoading: false,
  isError: false,
  filter: {},
  setFilter: jest.fn(),
  setSelectedServices: jest.fn(),
  customServices: [],
  user: { roles: [] },
  domainsFilter: { domainsFilter: [] },
  streetsFilter: { streetsFilter: [] },
  dateFilters: { yearFilter: [], monthFilter: [] },
}

describe('ServicesTable domain name', () => {
  beforeEach(() => {
    ;(useDeleteServiceMutation as jest.Mock).mockReturnValue([
      jest.fn(),
      { isLoading: false },
    ])
  })

  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('renders a short domain name in full with no tooltip', () => {
    setWidths(50, 50)
    render(
      <ServicesTable
        {...(baseProps as any)}
        services={{
          data: [
            {
              _id: '1',
              domain: { _id: 'd1', name: 'Rozetka' },
              date: '2026-09-01',
            },
          ],
          total: 1,
        }}
      />
    )

    expect(screen.getAllByText('Rozetka').length).toBeGreaterThan(0)
    const tooltipTexts = screen
      .queryAllByTestId('tooltip-title')
      .map((el) => el.textContent)
    expect(tooltipTexts).not.toContain('Rozetka')
  })

  it('truncates a long domain name and exposes it via tooltip', () => {
    setWidths(300, 50)
    const longName =
      'Товариство з обмеженою відповідальністю "Інноваційні рішення для бізнесу"'
    render(
      <ServicesTable
        {...(baseProps as any)}
        services={{
          data: [
            {
              _id: '1',
              domain: { _id: 'd1', name: longName },
              date: '2026-09-01',
            },
          ],
          total: 1,
        }}
      />
    )

    expect(screen.getAllByTestId('tooltip-title')[0]).toHaveTextContent(
      longName
    )
  })
})
