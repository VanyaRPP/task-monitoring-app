import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Form } from 'antd'
import CustomServicesCard from './index'
import { Roles } from '@utils/constants'

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('@utils/helpers', () => ({
  inputNumberParser: jest.fn((v) => v),
  isAdminCheck: jest.fn(
    (roles?: string[]) =>
      !!roles?.includes('GlobalAdmin') || !!roles?.includes('DomainAdmin')
  ),
}))

// antd Select's virtualised popup doesn't open in jsdom; stub it with a flat
// list of buttons so we can drive onChange via real clicks.
jest.mock('antd', () => {
  const actual = jest.requireActual('antd')
  const React = require('react')
  const MockSelect = ({
    options = [],
    value = [],
    onChange,
    placeholder,
  }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'mock-select' },
      placeholder &&
        React.createElement(
          'span',
          { 'data-testid': 'placeholder' },
          placeholder
        ),
      options.map((o: any) =>
        React.createElement(
          'button',
          {
            key: o.value,
            type: 'button',
            onClick: () => onChange?.([...value, o.value]),
          },
          o.label
        )
      )
    )
  return { ...actual, Select: MockSelect }
})

const mockUseGetCurrentUserQuery = require('@common/api/userApi/user.api')
  .useGetCurrentUserQuery as jest.Mock
const useWatchSpy = jest.spyOn(Form, 'useWatch')

const ALL_CUSTOM_SERVICES = [
  { _id: '1', label: 'Послуга 1', fieldName: 'service1' },
]

const renderWithForm = (ui: React.ReactElement) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [form] = Form.useForm()
    return <Form form={form}>{children}</Form>
  }
  return render(ui, { wrapper: Wrapper })
}

describe('CustomServicesCard', () => {
  const setFieldsValueMock = jest.fn()
  const defaultMockUser = { data: { roles: [Roles.DOMAIN_ADMIN] } }

  beforeEach(() => {
    mockUseGetCurrentUserQuery.mockReturnValue(defaultMockUser)
    useWatchSpy.mockReturnValue([])
    setFieldsValueMock.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders add button when not disabled and not service form', () => {
    renderWithForm(
      <CustomServicesCard
        form={{ setFieldsValue: setFieldsValueMock }}
        allCustomServices={ALL_CUSTOM_SERVICES}
        disabled={false}
        isServiceForm={false}
      />
    )

    expect(screen.getByText('Індивідуальні послуги')).toBeInTheDocument()
  })

  test('adds custom service from dropdown', () => {
    renderWithForm(
      <CustomServicesCard
        form={{ setFieldsValue: setFieldsValueMock }}
        allCustomServices={ALL_CUSTOM_SERVICES}
        disabled={false}
        isServiceForm={false}
      />
    )

    fireEvent.click(screen.getByText('Індивідуальні послуги'))
    fireEvent.click(screen.getByText('Послуга 1'))

    expect(setFieldsValueMock).toHaveBeenCalledWith({
      customServices: [
        {
          _id: '1',
          label: 'Послуга 1',
          fieldName: 'service1',
          price: 0,
        },
      ],
    })
  })
})
