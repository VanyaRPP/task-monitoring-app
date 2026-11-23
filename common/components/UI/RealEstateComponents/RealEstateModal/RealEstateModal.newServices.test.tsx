import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { message } from 'antd'
import RealEstateModal from './index'
import { Roles } from '@utils/constants'

const editRealEstateMock = jest.fn()
const addRealEstateMock = jest.fn()

jest.mock('@common/api/realestateApi/realestate.api', () => ({
  useAddRealEstateMutation: () => [addRealEstateMock, { isLoading: false }],
  useEditRealEstateMutation: () => [editRealEstateMock, { isLoading: false }],
}))

let mockDomainCatalog: { _id: string; name: string; fieldName: string }[] = []
jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: () => ({
    data: { data: [{ groupName: 'Загальні', services: mockDomainCatalog }] },
  }),
}))

jest.setTimeout(40000)

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: () => ({ data: { roles: ['DomainAdmin'] } }),
}))

jest.mock('../../ModalWindow', () => ({
  __esModule: true,
  default: ({ children, onOk, onCancel }: any) => (
    <div>
      {children}
      <button onClick={onCancel}>Відміна</button>
      <button onClick={() => Promise.resolve(onOk()).catch(() => undefined)}>
        Зберегти
      </button>
    </div>
  ),
}))

jest.mock('./RealEstateForm', () => {
  const { Form } = jest.requireActual('antd')
  const CustomServicesCard = jest.requireActual(
    '@components/UI/CustomServicesCard'
  ).default
  const MockRealEstateForm = ({ form, customServices }: any) => (
    <Form form={form}>
      <CustomServicesCard
        form={form}
        allCustomServices={customServices}
        skipAutoPopulate
        allowCreateServices
      />
    </Form>
  )
  return { __esModule: true, default: MockRealEstateForm }
})

jest.mock('antd', () => {
  const actual = jest.requireActual('antd')
  const React = require('react')
  const MockSelect = React.forwardRef(
    ({ popupRender, options = [], value = [], onChange }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ blur: jest.fn() }))
      return React.createElement(
        'div',
        null,
        options.map((o: any) =>
          React.createElement(
            'button',
            {
              key: o.value,
              type: 'button',
              onClick: () => onChange?.([...value, o.value]),
            },
            `option: ${o.label}`
          )
        ),
        popupRender && popupRender(null)
      )
    }
  )
  MockSelect.displayName = 'MockSelect'
  return { ...actual, Select: MockSelect }
})

const LIFT = { _id: 'svc-lift', name: 'Ліфт', fieldName: 'lift' }
const SECURITY = { _id: 'svc-security', name: 'Охорона', fieldName: 'okhorona' }

const companyA = {
  _id: 'company-a',
  domain: { _id: 'd1' },
  street: { _id: 'street-1' },
  companyName: 'Компанія А',
  customServices: [
    { _id: 'svc-lift', label: 'Ліфт', fieldName: 'lift', price: 12 },
  ],
} as any

const companyB = {
  ...companyA,
  _id: 'company-b',
  companyName: 'Компанія Б',
} as any

const renderModal = (company = companyA, closeModal = jest.fn()) => {
  const utils = render(
    <RealEstateModal
      chosenRealEstate={null}
      currentRealEstate={company}
      closeModal={closeModal}
      editable
    />
  )
  return { ...utils, closeModal }
}

const nameInput = () =>
  screen.getByRole('textbox', { name: 'Назва нової послуги' })

const addNewService = async (name: string, price: string) => {
  await userEvent.click(
    screen.getByRole('button', { name: /Створити нову послугу/ })
  )
  await waitFor(() => expect(nameInput()).toHaveFocus())
  await userEvent.keyboard(`${name}{Enter}`)
  await screen.findByText(name)
  if (!price) return
  const prices = screen.getAllByRole('spinbutton')
  await userEvent.type(prices[prices.length - 1], price)
}

const save = () =>
  userEvent.click(screen.getByRole('button', { name: 'Зберегти' }))
const sentServices = (call = 0) =>
  editRealEstateMock.mock.calls[call][0].customServices

describe('RealEstateModal — new services created on the «Послуги» tab', () => {
  let errorSpy: jest.SpyInstance
  let successSpy: jest.SpyInstance

  beforeEach(() => {
    mockDomainCatalog = [LIFT]
    editRealEstateMock.mockResolvedValue({ data: {} })
    addRealEstateMock.mockResolvedValue({ data: {} })
    errorSpy = jest.spyOn(message, 'error').mockImplementation(jest.fn())
    successSpy = jest.spyOn(message, 'success').mockImplementation(jest.fn())
    jest.spyOn(console, 'error').mockImplementation(jest.fn())
  })

  afterEach(() => jest.restoreAllMocks())
  afterEach(() => jest.clearAllMocks())

  it('sends nothing until «Зберегти» is pressed', async () => {
    renderModal()

    await addNewService('Охорона', '300')

    expect(editRealEstateMock).not.toHaveBeenCalled()
    expect(addRealEstateMock).not.toHaveBeenCalled()
  })

  it('saves the new service with its price together with the existing ones, in one request', async () => {
    const { closeModal } = renderModal()
    await addNewService('Охорона', '300')

    await save()

    await waitFor(() => expect(editRealEstateMock).toHaveBeenCalledTimes(1))
    expect(editRealEstateMock.mock.calls[0][0]._id).toBe('company-a')
    expect(sentServices()).toEqual([
      expect.objectContaining({ _id: 'svc-lift', label: 'Ліфт', price: 12 }),
      expect.objectContaining({ label: 'Охорона', price: 300, isDraft: true }),
    ])
    expect(successSpy).toHaveBeenCalledWith('Збережено')
    expect(closeModal).toHaveBeenCalledTimes(1)
  })

  it('saves several new services at once, each once', async () => {
    renderModal()
    await addNewService('Охорона', '300')
    await addNewService('Вивіз снігу', '150')

    await save()

    await waitFor(() => expect(editRealEstateMock).toHaveBeenCalledTimes(1))
    const drafts = sentServices().filter((s: any) => s.isDraft)
    expect(drafts).toEqual([
      expect.objectContaining({ label: 'Охорона', price: 300 }),
      expect.objectContaining({ label: 'Вивіз снігу', price: 150 }),
    ])
    expect(new Set(drafts.map((s: any) => s._id)).size).toBe(2)
  })

  it('also works when adding a new company', async () => {
    render(
      <RealEstateModal
        chosenRealEstate={{ domain: 'd1', street: 'street-1' }}
        closeModal={jest.fn()}
        editable
      />
    )
    await addNewService('Охорона', '300')

    await save()

    await waitFor(() => expect(addRealEstateMock).toHaveBeenCalledTimes(1))
    expect(addRealEstateMock.mock.calls[0][0].customServices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Охорона',
          price: 300,
          isDraft: true,
        }),
      ])
    )
  })

  it('does not save while a new service still has the default name', async () => {
    renderModal()
    await userEvent.click(
      screen.getByRole('button', { name: /Створити нову послугу/ })
    )

    await save()

    expect(await screen.findByText('Змініть назву послуги')).toBeInTheDocument()
    expect(editRealEstateMock).not.toHaveBeenCalled()
  })

  it('does not save a new service without a price', async () => {
    renderModal()
    await addNewService('Охорона', '')

    await save()

    expect(await screen.findByText('Введіть значення')).toBeInTheDocument()
    expect(editRealEstateMock).not.toHaveBeenCalled()
  })

  it('sends a double-clicked «Зберегти» only once', async () => {
    let finishSave: (value: unknown) => void = () => undefined
    editRealEstateMock.mockReturnValue(
      new Promise((resolve) => {
        finishSave = resolve
      })
    )
    renderModal()
    await addNewService('Охорона', '300')

    await save()
    await save()
    finishSave({ data: {} })

    await waitFor(() => expect(successSpy).toHaveBeenCalled())
    expect(editRealEstateMock).toHaveBeenCalledTimes(1)
  })

  it('closing without saving sends nothing and the next opening has no new services', async () => {
    const { closeModal, rerender } = renderModal()
    await addNewService('Охорона', '300')
    await addNewService('Вивіз снігу', '150')

    await userEvent.click(screen.getByRole('button', { name: 'Відміна' }))

    expect(closeModal).toHaveBeenCalledTimes(1)
    expect(editRealEstateMock).not.toHaveBeenCalled()

    rerender(<></>)
    rerender(
      <RealEstateModal
        chosenRealEstate={null}
        currentRealEstate={companyA}
        closeModal={closeModal}
        editable
      />
    )
    expect(await screen.findByLabelText('Ліфт')).toBeInTheDocument()
    expect(screen.queryByText('Охорона')).not.toBeInTheDocument()
    expect(screen.queryByText('Вивіз снігу')).not.toBeInTheDocument()
  })

  describe('when saving fails', () => {
    beforeEach(() => {
      editRealEstateMock.mockResolvedValueOnce({
        error: { data: { message: 'Послуга «Охорона» вже існує в домені' } },
      })
    })

    it('shows the server error and keeps the modal and the new service', async () => {
      const { closeModal } = renderModal()
      await addNewService('Охорона', '300')

      await save()

      await waitFor(() =>
        expect(errorSpy).toHaveBeenCalledWith(
          'Помилка при збереженні: Послуга «Охорона» вже існує в домені'
        )
      )
      expect(closeModal).not.toHaveBeenCalled()
      expect(screen.getByText('Охорона')).toBeInTheDocument()
    })

    it('lets the user rename the service and try again', async () => {
      const { closeModal } = renderModal()
      await addNewService('Охорона', '300')
      await save()
      await waitFor(() => expect(errorSpy).toHaveBeenCalled())

      await userEvent.click(
        screen.getByRole('button', { name: 'Перейменувати Охорона' })
      )
      await waitFor(() => expect(nameInput()).toHaveFocus())
      await userEvent.keyboard('{Control>}a{/Control}Охорона двору{Enter}')
      await save()

      await waitFor(() => expect(closeModal).toHaveBeenCalledTimes(1))
      expect(editRealEstateMock).toHaveBeenCalledTimes(2)
      expect(sentServices(1)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ label: 'Охорона двору', isDraft: true }),
        ])
      )
    })
  })

  it('a service saved for company A is offered, not preselected, for company B', async () => {
    mockDomainCatalog = [LIFT, SECURITY]
    renderModal(companyB)

    expect(await screen.findByLabelText('Ліфт')).toBeInTheDocument()
    expect(screen.queryByLabelText('Охорона')).not.toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'option: Охорона' })
    )
    await userEvent.type(await screen.findByLabelText('Охорона'), '50')
    await save()

    await waitFor(() => expect(editRealEstateMock).toHaveBeenCalledTimes(1))
    expect(sentServices()).toEqual([
      expect.objectContaining({ _id: 'svc-lift', price: 12 }),
      expect.objectContaining({
        _id: 'svc-security',
        label: 'Охорона',
        price: 50,
      }),
    ])
    expect(sentServices().some((s: any) => s.isDraft)).toBe(false)
  })

  describe('regression: existing services', () => {
    it('saves an edited price of an existing service without any draft', async () => {
      renderModal()
      const liftPrice = await screen.findByLabelText('Ліфт')

      await userEvent.clear(liftPrice)
      await userEvent.type(liftPrice, '20')
      await save()

      await waitFor(() => expect(editRealEstateMock).toHaveBeenCalledTimes(1))
      expect(sentServices()).toEqual([
        { _id: 'svc-lift', label: 'Ліфт', fieldName: 'lift', price: 20 },
      ])
    })

    it('saves a company after an existing service was removed', async () => {
      renderModal()
      await userEvent.click(
        await screen.findByRole('button', { name: 'remove-Ліфт' })
      )

      await save()

      await waitFor(() => expect(editRealEstateMock).toHaveBeenCalledTimes(1))
      expect(sentServices()).toEqual([])
    })
  })
})
