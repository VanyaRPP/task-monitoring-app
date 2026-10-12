import React from 'react'
import { render, screen } from '@testing-library/react'
import ListOneTask from '.'

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))

jest.mock('./deadline', () => () => null)

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

const baseTask = {
  _id: '1',
  status: 'active',
  category: 'Category',
  description: 'Description',
  address: { name: 'Some street 1' },
  deadline: '2026-09-10',
}

describe('ListOneTask', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as any).scrollWidth
    delete (HTMLElement.prototype as any).clientWidth
  })

  it('renders a short task name in full with no tooltip', () => {
    setWidths(50, 50)
    render(<ListOneTask tasks={[{ ...baseTask, name: 'Fix sink' } as any]} />)

    expect(screen.getByText('Fix sink')).toBeInTheDocument()
    expect(screen.queryByTestId('tooltip-title')).not.toBeInTheDocument()
  })

  it('truncates a long task name and exposes it via tooltip', () => {
    setWidths(300, 50)
    const longName =
      'Дуже довга назва завдання, яка точно не поміщається у колонку таблиці'
    render(<ListOneTask tasks={[{ ...baseTask, name: longName } as any]} />)

    expect(screen.getByTestId('tooltip-title')).toHaveTextContent(longName)
  })
})
