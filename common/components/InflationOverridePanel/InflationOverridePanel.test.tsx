import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {
  useGetDomainInflationIndexesQuery,
  useResetDomainInflationOverrideMutation,
  useSetDomainInflationOverrideMutation,
} from '@common/api/inflationIndexApi/inflationIndex.api'
import InflationOverridePanel from './index'

jest.mock('@common/api/inflationIndexApi/inflationIndex.api', () => ({
  useGetDomainInflationIndexesQuery: jest.fn(),
  useSetDomainInflationOverrideMutation: jest.fn(),
  useResetDomainInflationOverrideMutation: jest.fn(),
}))

const MONTHS = [
  {
    year: 2026,
    month: 9,
    reference: null,
    override: null,
    value: null,
  },
  {
    year: 2026,
    month: 8,
    reference: 100.1,
    override: {
      value: 101.5,
      updatedBy: 'admin-a@test.ua',
      updatedAt: '2026-10-01T10:00:00.000Z',
    },
    value: 101.5,
  },
]

const setOverride = jest.fn()
const resetOverride = jest.fn()

const renderPanel = (canEdit: boolean) => {
  ;(useGetDomainInflationIndexesQuery as jest.Mock).mockReturnValue({
    data: { canEdit, months: MONTHS },
    isFetching: false,
  })
  render(
    <InflationOverridePanel domains={[{ text: 'ОСББ А', value: 'domain-a' }]} />
  )
  return userEvent.click(screen.getByText('Індекс інфляції домену'))
}

const augustRow = () =>
  screen.getByText(/Серпень 2026/).closest('tr') as HTMLElement

beforeEach(() => {
  jest.clearAllMocks()
  setOverride.mockReturnValue({ unwrap: () => Promise.resolve({}) })
  resetOverride.mockReturnValue({ unwrap: () => Promise.resolve({}) })
  ;(useSetDomainInflationOverrideMutation as jest.Mock).mockReturnValue([
    setOverride,
    { isLoading: false },
  ])
  ;(useResetDomainInflationOverrideMutation as jest.Mock).mockReturnValue([
    resetOverride,
    { isLoading: false },
  ])
})

describe('InflationOverridePanel', () => {
  it('показує довідник, значення домену і позначку «змінено для домену»', async () => {
    await renderPanel(false)

    const row = within(augustRow())
    expect(row.getByText('100.1')).toBeInTheDocument()
    expect(row.getByText('101.5')).toBeInTheDocument()
    expect(row.getByText('змінено для домену')).toBeInTheDocument()
  })

  it('без права редагування — лише перегляд, без кнопок', async () => {
    await renderPanel(false)

    expect(screen.queryByRole('button', { name: 'Змінити' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Скинути до довідника' })
    ).toBeNull()
    expect(screen.getByText(/Лише перегляд/)).toBeInTheDocument()
  })

  it('адмін бачить «Змінити» і «Скинути» лише там, де є значення домену', async () => {
    await renderPanel(true)

    expect(screen.getAllByRole('button', { name: 'Змінити' })).toHaveLength(2)
    expect(
      within(augustRow()).getByRole('button', { name: 'Скинути до довідника' })
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Скинути до довідника' })
    ).toHaveLength(1)
  })

  it('зберігає нове значення для домену', async () => {
    await renderPanel(true)

    await userEvent.click(
      within(augustRow()).getByRole('button', { name: 'Змінити' })
    )
    const input = screen.getByLabelText('Індекс домену за Серпень 2026')
    await userEvent.clear(input)
    await userEvent.type(input, '102.3')
    await userEvent.click(screen.getByRole('button', { name: 'Зберегти' }))

    expect(setOverride).toHaveBeenCalledWith({
      domainId: 'domain-a',
      year: 2026,
      month: 8,
      value: 102.3,
    })
  })

  it('«Скинути до довідника» після підтвердження прибирає значення домену', async () => {
    await renderPanel(true)

    await userEvent.click(
      within(augustRow()).getByRole('button', { name: 'Скинути до довідника' })
    )
    await userEvent.click(
      await screen.findByRole('button', { name: 'Скинути' })
    )

    expect(resetOverride).toHaveBeenCalledWith({
      domainId: 'domain-a',
      year: 2026,
      month: 8,
    })
  })
})
