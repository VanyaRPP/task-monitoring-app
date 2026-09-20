import React from 'react'
import { render, screen } from '@testing-library/react'
import Orders from './orders'
import { useGetAllTaskQuery } from '../../../api/taskApi/task.api'
import { useGetUserByEmailQuery } from '../../../api/userApi/user.api'
import { useSession } from 'next-auth/react'

jest.mock('../../../api/taskApi/task.api', () => ({
  useGetAllTaskQuery: jest.fn(),
}))

jest.mock('../../../api/userApi/user.api', () => ({
  useGetUserByEmailQuery: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('@components/UI/OrdersTableHeader', () => () => null)

jest.mock('../../MicroInfoProfile', () => () => null)

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

describe('Orders block', () => {
  beforeEach(() => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'me@test.com' } },
    })
    ;(useGetUserByEmailQuery as jest.Mock).mockReturnValue({
      data: { data: { _id: 'u1' } },
    })
  })

  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('renders a short order name in full with no tooltip', () => {
    setWidths(50, 50)
    ;(useGetAllTaskQuery as jest.Mock).mockReturnValue({
      data: {
        data: [
          {
            _id: '1',
            name: 'Order A',
            creator: 'u1',
            status: 'active',
            deadline: '2026-09-10',
          },
        ],
      },
    })

    render(<Orders />)

    expect(screen.getByText('Order A')).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip-title')).not.toBeInTheDocument()
  })

  it('truncates a long order name and exposes it via tooltip', () => {
    setWidths(300, 50)
    const longName =
      'Дуже довга назва замовлення, яка точно не поміщається у колонку'
    ;(useGetAllTaskQuery as jest.Mock).mockReturnValue({
      data: {
        data: [
          {
            _id: '1',
            name: longName,
            creator: 'u1',
            status: 'active',
            deadline: '2026-09-10',
          },
        ],
      },
    })

    render(<Orders />)

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(longName)
  })
})
