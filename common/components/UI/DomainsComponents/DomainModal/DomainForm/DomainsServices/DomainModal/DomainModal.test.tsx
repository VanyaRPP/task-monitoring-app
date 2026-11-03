import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event'
import { defaultServices, Roles } from '@utils/constants'
import DomainModal from '.'

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useDeleteCustomServiceMutation: () => [jest.fn(), { isLoading: false }],
  useEditCustomServiceMutation: () => [jest.fn(), { isLoading: false }],
}))

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: () => ({
    data: { email: 'admin@example.com', roles: [Roles.GLOBAL_ADMIN] },
  }),
}))

// Why: antd's CSS-in-JS makes every jsdom getComputedStyle call expensive, and
// both `getByRole` (accessibility tree) and user-event's pointer-events check
// call it up the whole ancestor chain. Under a full parallel `yarn test` that
// pushed this suite past the timeout, so toggles are found by their
// aria-label and the pointer-events check is skipped.
const user = () =>
  userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never })

const DISABLE = 'Вимкнути послугу'
const ENABLE = 'Увімкнути послугу'

const protectedId = defaultServices[0]
const data = [
  { key: 'rent', title: 'Розміщення' },
  { key: 'parking', title: 'Паркінг' },
  { key: protectedId, title: 'Електропостачання' },
]
const serviceGroups = [
  { groupName: 'Загальні', services: ['rent', 'parking', protectedId] },
]

const baseProps = () => ({
  onClose: jest.fn(),
  data,
  serviceGroups,
  disabledServiceIds: ['parking'],
  onSave: jest.fn(),
  onCreateCustomService: jest.fn(),
  domainId: 'domain-1',
})

const renderModal = (
  props: Partial<React.ComponentProps<typeof DomainModal>> = {}
) => {
  const all = { ...baseProps(), ...props }
  return { ...render(<DomainModal open {...all} />), ...all }
}

/** The styled Typography wrapping a service title (`strong` adds a tag). */
const titleOf = (title: string) =>
  screen.getByText(title).closest('.ant-typography') as HTMLElement

/** The Transfer row holding a service, located by its title. */
const rowOf = (title: string) =>
  screen.getByText(title).closest('li') as HTMLElement

const toggleIn = (title: string, label: string) =>
  within(rowOf(title)).getByLabelText(label)

const footerButton = (text: string) =>
  screen.getByText(text).closest('button') as HTMLElement

describe('DomainModal — enabling/disabling services', () => {
  it('shows "−" for an enabled service and "+" for a disabled one', () => {
    renderModal()

    expect(toggleIn('Розміщення', DISABLE)).toBeInTheDocument()
    expect(toggleIn('Паркінг', ENABLE)).toBeInTheDocument()
  })

  it('dims the title of a disabled service only', () => {
    renderModal()

    expect(titleOf('Паркінг')).toHaveStyle({ opacity: '0.45' })
    expect(titleOf('Розміщення')).toHaveStyle({ opacity: '1' })
  })

  it('shows the action in a tooltip on hover', async () => {
    renderModal()

    await user().hover(toggleIn('Розміщення', DISABLE))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(DISABLE)
  })

  it('lets a protected service be toggled although it cannot be edited', async () => {
    const { onSave } = renderModal()
    const u = user()

    expect(
      within(rowOf('Електропостачання')).queryByLabelText('edit')
    ).not.toBeInTheDocument()
    await u.click(toggleIn('Електропостачання', DISABLE))
    await u.click(footerButton('Зберегти'))

    expect(onSave).toHaveBeenCalledWith(serviceGroups, ['parking', protectedId])
  })

  it('saves toggles without removing services from the list', async () => {
    const { onSave } = renderModal()
    const u = user()

    await u.click(toggleIn('Розміщення', DISABLE))
    await u.click(toggleIn('Паркінг', ENABLE))

    // Both stay listed; only their state flips.
    expect(toggleIn('Розміщення', ENABLE)).toBeInTheDocument()
    expect(titleOf('Паркінг')).toHaveStyle({ opacity: '1' })

    await u.click(footerButton('Зберегти'))

    expect(onSave).toHaveBeenCalledWith(serviceGroups, ['rent'])
  })

  it('does not move the service between Transfer lists when toggled', async () => {
    renderModal()

    await user().click(toggleIn('Розміщення', DISABLE))

    expect(
      rowOf('Розміщення').querySelector('input[type="checkbox"]')
    ).not.toBeChecked()
  })

  it('discards toggles on cancel', async () => {
    const { onSave, onClose, rerender } = renderModal()
    const u = user()

    await u.click(toggleIn('Розміщення', DISABLE))
    await u.click(footerButton('Скасувати'))

    expect(onClose).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()

    // Reopening starts from the persisted state again.
    const props = { ...baseProps(), onClose, onSave }
    rerender(<DomainModal open={false} {...props} />)
    rerender(<DomainModal open {...props} />)

    await waitFor(() =>
      expect(toggleIn('Розміщення', DISABLE)).toBeInTheDocument()
    )
  })

  it('hides the toggle in read-only mode', () => {
    renderModal({ editable: false })

    expect(screen.queryByLabelText(DISABLE)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(ENABLE)).not.toBeInTheDocument()
  })
})
