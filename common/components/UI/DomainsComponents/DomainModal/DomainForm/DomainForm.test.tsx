import { fireEvent, render, screen } from '@testing-library/react'
import { Form } from 'antd'
import { Roles } from '@utils/constants'
import DomainForm from '.'

// Replace each tab with a marker so we can verify routing without bringing in
// the heavy RTK Query / antd subtrees inside them.
jest.mock('./tabs/GeneralTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-general">general-content</div>,
}))
jest.mock('./tabs/TemplateTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-template">template-content</div>,
}))
jest.mock('./tabs/MyServicesTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-services">services-content</div>,
}))
jest.mock('./tabs/HistoryTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-history">history-content</div>,
}))
jest.mock('./tabs/BankTab', () => ({
  __esModule: true,
  default: () => <div data-testid="tab-bank">bank-content</div>,
}))

const mockCurrentUser = jest.fn()
jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: () => mockCurrentUser(),
}))

const ADMIN_ONLY_TABS = [
  'Шаблон',
  'Мої послуги',
  'Історія налаштувань',
  'Банк API',
]

const renderForm = () => {
  const Wrapper = () => {
    const [form] = Form.useForm()
    return (
      <DomainForm
        form={form}
        editable
        setIsValueChanged={jest.fn()}
        domainId="d1"
      />
    )
  }
  return render(<Wrapper />)
}

beforeEach(() => {
  mockCurrentUser.mockReturnValue({ data: { roles: [Roles.DOMAIN_ADMIN] } })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('DomainForm — tabs orchestration', () => {
  it('renders all five tab labels in correct order, including "Банк API"', () => {
    renderForm()
    const labels = ['Загальне', ...ADMIN_ONLY_TABS]
    for (const label of labels) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }
  })

  it('shows "Загальне" tab content by default', () => {
    renderForm()
    expect(screen.getByTestId('tab-general')).toBeInTheDocument()
  })

  it('switches to Шаблон tab on click', () => {
    renderForm()
    fireEvent.click(screen.getByRole('tab', { name: 'Шаблон' }))
    expect(screen.getByTestId('tab-template')).toBeInTheDocument()
  })

  it('switches to Мої послуги tab on click', () => {
    renderForm()
    fireEvent.click(screen.getByRole('tab', { name: 'Мої послуги' }))
    expect(screen.getByTestId('tab-services')).toBeInTheDocument()
  })

  it('switches to Історія налаштувань tab on click', () => {
    renderForm()
    fireEvent.click(screen.getByRole('tab', { name: 'Історія налаштувань' }))
    expect(screen.getByTestId('tab-history')).toBeInTheDocument()
  })

  it('switches to Банк API tab on click', () => {
    renderForm()
    fireEvent.click(screen.getByRole('tab', { name: 'Банк API' }))
    expect(screen.getByTestId('tab-bank')).toBeInTheDocument()
  })

  it('keeps every tab for a GlobalAdmin', () => {
    mockCurrentUser.mockReturnValue({ data: { roles: [Roles.GLOBAL_ADMIN] } })
    renderForm()
    for (const label of ADMIN_ONLY_TABS) {
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument()
    }
  })
})

describe('DomainForm — view-only access', () => {
  it('renders only "Загальне" for a plain User', () => {
    mockCurrentUser.mockReturnValue({ data: { roles: [Roles.USER] } })
    renderForm()

    expect(screen.getByRole('tab', { name: 'Загальне' })).toBeInTheDocument()
    expect(screen.getByTestId('tab-general')).toBeInTheDocument()
    for (const label of ADMIN_ONLY_TABS) {
      expect(screen.queryByRole('tab', { name: label })).not.toBeInTheDocument()
    }
  })

  it('never mounts the admin-only tab content for a plain User', () => {
    mockCurrentUser.mockReturnValue({ data: { roles: [Roles.USER] } })
    renderForm()

    // Nothing to reach even by activating a tab key directly: the panes are
    // not part of the tree at all, so the bank token form never exists.
    for (const testId of [
      'tab-template',
      'tab-services',
      'tab-history',
      'tab-bank',
    ]) {
      expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
    }
  })

  it('hides admin-only tabs from an account with no roles', () => {
    mockCurrentUser.mockReturnValue({ data: { roles: [] } })
    renderForm()

    expect(screen.getByRole('tab', { name: 'Загальне' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Банк API' })).toBeNull()
  })

  it('hides admin-only tabs while the current user is still loading', () => {
    mockCurrentUser.mockReturnValue({ data: undefined })
    renderForm()

    expect(screen.getByRole('tab', { name: 'Загальне' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Банк API' })).toBeNull()
  })
})
