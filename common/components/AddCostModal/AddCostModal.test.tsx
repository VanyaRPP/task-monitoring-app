import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddCostModal, { type IProfitDraft } from './index'

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params?.amount ? `${key} ${params.amount}` : key,
  }),
}))

const createProfit = jest.fn()
const updateProfit = jest.fn()
jest.mock('@common/api/profitsApi/profits.api', () => ({
  useCreateProfitMutation: () => [createProfit, { isLoading: false }],
  useUpdateProfitMutation: () => [updateProfit],
}))

// Not under test; every case here runs with an activeScope or a draft.
jest.mock('@components/UI/Reusable/DomainsSelect', () => ({
  __esModule: true,
  default: () => null,
}))

// What the Прибутки page offers, and the scope selected there.
let pageScopeKey = 'company:co-1'
jest.mock('@modules/store/hooks', () => ({
  useAppSelector: (select: (state: unknown) => unknown) =>
    select({ profitPage: { activeTabKey: pageScopeKey } }),
}))
jest.mock('@components/Pages/ProfiitPage/hook/useProfitScopes', () => ({
  ...jest.requireActual('@components/Pages/ProfiitPage/hook/useProfitScopes'),
  useProfitScopes: () => ({
    domainOptions: [
      { type: 'domain', key: 'dom-1', label: 'ОСББ' },
      { type: 'domain', key: 'dom-2', label: 'Інший домен' },
    ],
    companyOptions: [{ type: 'company', key: 'co-1', label: 'Кав’ярня' }],
    isLoading: false,
    isError: false,
  }),
}))

const scope = { type: 'domain' as const, id: 'dom-1', label: 'ОСББ' }

beforeEach(() => {
  jest.clearAllMocks()
  pageScopeKey = 'company:co-1'
  createProfit.mockResolvedValue({ data: { success: true } })
  updateProfit.mockResolvedValue({ data: { success: true } })
})

// One input event per field instead of one per keystroke: typing the whole
// receipt key by key made this suite slow enough to time out in a full run.
const enter = async (field: HTMLElement, text: string) => {
  await userEvent.click(field)
  await userEvent.paste(text)
}

const save = () =>
  userEvent.click(screen.getByText('profitPage:modal.okText').closest('button'))

const total = () => screen.getByText(/profitPage:form.amountDebit:/).textContent

describe('AddCostModal with line items', () => {
  it('saves typed lines as items and shows their running total', async () => {
    render(<AddCostModal closeModal={jest.fn()} activeScope={scope} />)

    // By text, not *ByRole: role queries over antd's large DOM are what made
    // this test slow enough to time out in a full run.
    const [categoryPlaceholder] = await screen.findAllByText(
      'profitPage:form.itemCategoryPlaceholder'
    )
    const category = categoryPlaceholder
      .closest('.ant-select')
      .querySelector('input') as HTMLElement
    await enter(category, 'Прибирання')
    const [amount] = screen.getAllByPlaceholderText(
      'profitPage:form.amountPlaceholder'
    )
    await enter(amount, '2600')

    await userEvent.click(
      screen.getAllByText('profitPage:form.addItem')[0].closest('button')
    )
    const amounts = screen.getAllByPlaceholderText(
      'profitPage:form.amountPlaceholder'
    )
    await enter(amounts[1], '500')
    const notes = screen.getAllByPlaceholderText(
      'profitPage:form.itemDescriptionPlaceholder'
    )
    await enter(notes[1], 'віск')

    await waitFor(() => expect(total()).toMatch(/3\s100,00/))

    await save()

    await waitFor(() => expect(createProfit).toHaveBeenCalledTimes(1))
    const body = createProfit.mock.calls[0][0]
    expect(body).toMatchObject({ domain: 'dom-1', type: 'debit' })
    expect(body.amount).toBeUndefined()
    expect(body.items).toEqual([
      { category: 'Прибирання', amount: 2600, description: undefined },
      { category: undefined, amount: 500, description: 'віск' },
    ])
    // Many antd field interactions; slow on a loaded CI runner.
  }, 30000)

  it('opens a draft prefilled and saves it as a new record', async () => {
    const draft: IProfitDraft = {
      type: 'debit',
      periodMonth: '2026-09',
      items: [
        { category: 'Прибирання', amount: 2600, description: '13 × 200' },
        { category: 'Корпоратив', amount: 3700, description: 'суші, піца' },
        { category: 'Кава-чай', amount: 300, description: 'цукерки' },
        { category: 'Матеріали', amount: 500, description: 'віск' },
        { category: 'Доставка', amount: 145, description: 'посилка' },
      ],
    }
    render(
      <AddCostModal closeModal={jest.fn()} draft={draft} activeScope={scope} />
    )

    await waitFor(() => expect(total()).toMatch(/7\s245,00/))
    expect(screen.getByDisplayValue('Корпоратив')).toBeInTheDocument()

    await save()

    await waitFor(() => expect(createProfit).toHaveBeenCalledTimes(1))
    expect(updateProfit).not.toHaveBeenCalled()
    const body = createProfit.mock.calls[0][0]
    expect(body.items).toEqual(draft.items)
    expect(body.periodMonth).toBe('2026-09')
  })

  it('does not save while a line has no amount', async () => {
    render(<AddCostModal closeModal={jest.fn()} activeScope={scope} />)

    await save()

    expect(
      await screen.findByText('profitPage:form.itemAmountRequired')
    ).toBeInTheDocument()
    expect(createProfit).not.toHaveBeenCalled()
  })

  it('asks to split an older multi-category record when editing it', async () => {
    render(
      <AddCostModal
        closeModal={jest.fn()}
        activeScope={scope}
        profitActions={{ edit: true }}
        currentProfit={{
          _id: 'p-1',
          amount: 3100,
          type: 'debit',
          date: '2026-09-10',
          categories: ['Прибирання', 'Матеріали'],
        }}
      />
    )

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/profitPage:form.splitLegacy 3\s100,00/))
    expect(screen.getByDisplayValue('Прибирання')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Матеріали')).toBeInTheDocument()
    expect(
      screen
        .getAllByPlaceholderText('profitPage:form.amountPlaceholder')
        .map((input) => (input as HTMLInputElement).value)
    ).toEqual(['', ''])
  })

  describe('a draft from the assistant picks its target', () => {
    const items = [{ category: 'Матеріали', amount: 500 }]
    const scopeSelect = () =>
      screen
        .getByText('profitPage:form.scope')
        .closest('.ant-form-item') as HTMLElement

    it('defaults to the scope selected on the Прибутки page', async () => {
      render(
        <AddCostModal closeModal={jest.fn()} draft={{ type: 'debit', items }} />
      )

      expect(
        await within(scopeSelect()).findByText('Кав’ярня')
      ).toBeInTheDocument()

      await save()

      await waitFor(() => expect(createProfit).toHaveBeenCalledTimes(1))
      const body = createProfit.mock.calls[0][0]
      expect(body.company).toBe('co-1')
      expect(body.domain).toBeUndefined()
    })

    it('starts from the domain the draft names', async () => {
      render(
        <AddCostModal
          closeModal={jest.fn()}
          draft={{
            type: 'debit',
            scope: { type: 'domain', id: 'dom-2', label: 'Інший домен' },
            items,
          }}
        />
      )

      expect(
        await within(scopeSelect()).findByText('Інший домен')
      ).toBeInTheDocument()

      await save()

      await waitFor(() => expect(createProfit).toHaveBeenCalledTimes(1))
      expect(createProfit.mock.calls[0][0].domain).toBe('dom-2')
    })

    it('can be moved to a company', async () => {
      render(
        <AddCostModal
          closeModal={jest.fn()}
          draft={{
            type: 'debit',
            scope: { type: 'domain', id: 'dom-1', label: 'ОСББ' },
            items,
          }}
        />
      )

      await userEvent.click(within(scopeSelect()).getByRole('combobox'))
      // antd renders its own option rows; the a11y `option` nodes are empty.
      const [option] = (await screen.findAllByTitle('Кав’ярня')).filter((el) =>
        el.classList.contains('ant-select-item-option')
      )
      await userEvent.click(option)
      await save()

      await waitFor(() => expect(createProfit).toHaveBeenCalledTimes(1))
      const body = createProfit.mock.calls[0][0]
      expect(body.company).toBe('co-1')
      expect(body.domain).toBeUndefined()
    })

    it('falls back to the first domain when the page has nothing selected', async () => {
      pageScopeKey = 'tab1'
      render(
        <AddCostModal closeModal={jest.fn()} draft={{ type: 'debit', items }} />
      )

      expect(await within(scopeSelect()).findByText('ОСББ')).toBeInTheDocument()
    })
  })
})
