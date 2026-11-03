import React from 'react'
import { render, screen } from '@testing-library/react'
import MicroInfoProfile from '.'
import { useGetUserByIdQuery } from '../../api/userApi/user.api'

jest.mock('../../api/userApi/user.api', () => ({
  useGetUserByIdQuery: jest.fn(),
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

describe('MicroInfoProfile', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('shows a short name in full with no tooltip', () => {
    setWidths(50, 50)
    ;(useGetUserByIdQuery as jest.Mock).mockReturnValue({
      data: { name: 'Kys' },
    })
    render(<MicroInfoProfile id="1" />)

    expect(screen.getByText('Kys')).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
  })

  it('falls back to email when name is missing', () => {
    setWidths(50, 50)
    ;(useGetUserByIdQuery as jest.Mock).mockReturnValue({
      data: { email: 'user@example.com' },
    })
    render(<MicroInfoProfile id="1" />)

    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('truncates a long name and exposes it via tooltip', () => {
    setWidths(200, 50)
    const longName = 'Дуже довге ім’я користувача, яке не поміщається у блок'
    ;(useGetUserByIdQuery as jest.Mock).mockReturnValue({
      data: { name: longName },
    })
    render(<MicroInfoProfile id="1" />)

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(longName)
  })
})
