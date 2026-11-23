import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { Form, FormInstance } from 'antd'
import CustomServicesCard from './index'
import { Roles } from '@utils/constants'

jest.mock('@common/api/userApi/user.api', () => ({
  useGetCurrentUserQuery: jest.fn(),
}))

jest.mock('antd', () => {
  const actual = jest.requireActual('antd')
  const React = require('react')
  const MockSelect = React.forwardRef(
    (
      {
        popupRender,
        options = [],
        value = [],
        onChange,
        searchValue,
        onSearch,
      }: any,
      ref: any
    ) => {
      React.useImperativeHandle(ref, () => ({ blur: jest.fn() }))
      return React.createElement(
        'div',
        { 'data-testid': 'mock-select' },
        React.createElement('input', {
          'aria-label': 'Пошук послуг',
          value: searchValue ?? '',
          onChange: (e: any) => onSearch?.(e.target.value),
        }),
        options.map((o: any) =>
          React.createElement(
            'button',
            {
              key: o.value,
              type: 'button',
              'aria-pressed': value.includes(o.value),
              onClick: () =>
                onChange?.(
                  value.includes(o.value)
                    ? value.filter((v: string) => v !== o.value)
                    : [...value, o.value]
                ),
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

const mockUseGetCurrentUserQuery = require('@common/api/userApi/user.api')
  .useGetCurrentUserQuery as jest.Mock

const DOMAIN_SERVICES = [
  { _id: 'svc-1', label: 'Прибирання', fieldName: 'pribyrannia' },
]

let formRef: FormInstance

const Harness: React.FC<{ onModalKeyDown?: () => void }> = ({
  onModalKeyDown,
}) => {
  const [form] = Form.useForm()
  formRef = form
  return (
    <div onKeyDown={(e) => e.key === 'Escape' && onModalKeyDown?.()}>
      <Form form={form} initialValues={{ customServices: [] }}>
        <CustomServicesCard
          form={form}
          allCustomServices={DOMAIN_SERVICES}
          skipAutoPopulate
          allowCreateServices
        />
      </Form>
    </div>
  )
}

const createButton = () =>
  screen.getByRole('button', { name: /Створити нову послугу/ })
const nameInput = () =>
  screen.getByRole('textbox', { name: 'Назва нової послуги' })
const searchInput = () => screen.getByRole('textbox', { name: 'Пошук послуг' })

const addDraft = async (name: string) => {
  await userEvent.click(createButton())
  await waitFor(() => expect(nameInput()).toHaveFocus())
  await userEvent.keyboard(`${name}{Enter}`)
  await waitFor(() =>
    expect(
      screen.queryByRole('textbox', { name: 'Назва нової послуги' })
    ).not.toBeInTheDocument()
  )
}

describe('CustomServicesCard — creating a service inline', () => {
  const fetchSpy = jest.fn()

  beforeEach(() => {
    mockUseGetCurrentUserQuery.mockReturnValue({
      data: { roles: [Roles.DOMAIN_ADMIN] },
    })
    global.fetch = fetchSpy
  })

  afterEach(() => jest.clearAllMocks())

  it('adds a "Нова послуга" row in rename mode with the name selected, without any request', async () => {
    render(<Harness />)

    await userEvent.click(createButton())

    const input = nameInput() as HTMLInputElement
    expect(input).toHaveValue('Нова послуга')
    await waitFor(() => expect(input).toHaveFocus())
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe('Нова послуга'.length)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('confirms a typed name: the row stays with a price input and is submitted as a draft', async () => {
    render(<Harness />)
    await userEvent.click(createButton())

    await userEvent.keyboard('Охорона{Enter}')

    await waitFor(() =>
      expect(
        screen.queryByRole('textbox', { name: 'Назва нової послуги' })
      ).not.toBeInTheDocument()
    )
    expect(screen.getByText('Охорона')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('spinbutton'), '250')
    const values = await formRef.validateFields()
    expect(values.customServices).toEqual([
      expect.objectContaining({ label: 'Охорона', price: 250, isDraft: true }),
    ])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('drops the unconfirmed draft on Escape without closing the modal', async () => {
    const onModalKeyDown = jest.fn()
    render(<Harness onModalKeyDown={onModalKeyDown} />)
    await userEvent.click(createButton())

    await userEvent.keyboard('{Escape}')

    expect(
      screen.queryByRole('textbox', { name: 'Назва нової послуги' })
    ).not.toBeInTheDocument()
    expect(formRef.getFieldValue('customServices')).toEqual([])
    expect(onModalKeyDown).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('drops the unconfirmed draft via the cancel button', async () => {
    render(<Harness />)
    await userEvent.click(createButton())

    await userEvent.click(
      screen.getByRole('button', { name: 'Скасувати створення послуги' })
    )

    expect(formRef.getFieldValue('customServices')).toEqual([])
  })

  it.each([
    ['an empty name', '{Enter}', 'Вкажіть назву послуги'],
    ['the default name', 'Нова послуга{Enter}', 'Змініть назву послуги'],
    [
      'a name taken in the domain',
      'прибирання{Enter}',
      'Послуга з такою назвою вже існує',
    ],
  ])('does not confirm %s', async (_, typed, error) => {
    render(<Harness />)
    await userEvent.click(createButton())

    await userEvent.clear(nameInput())
    await userEvent.type(nameInput(), typed)

    expect(await screen.findByText(error)).toBeInTheDocument()
    expect(nameInput()).toBeInTheDocument()
    await expect(formRef.validateFields()).rejects.toBeTruthy()
  })

  it('reverts a rename of a confirmed draft on Escape instead of removing it', async () => {
    render(<Harness />)
    await userEvent.click(createButton())
    await userEvent.keyboard('Охорона{Enter}')

    await userEvent.click(
      await screen.findByRole('button', { name: 'Перейменувати Охорона' })
    )
    await userEvent.type(nameInput(), 'Інше')
    await userEvent.keyboard('{Escape}')

    expect(await screen.findByText('Охорона')).toBeInTheDocument()
    expect(formRef.getFieldValue('customServices')).toEqual([
      expect.objectContaining({ label: 'Охорона', isDraft: true }),
    ])
  })

  it('can remove a confirmed draft before saving', async () => {
    render(<Harness />)
    await userEvent.click(createButton())
    await userEvent.keyboard('Охорона{Enter}')

    await userEvent.click(
      await screen.findByRole('button', { name: 'remove-Охорона' })
    )

    expect(formRef.getFieldValue('customServices')).toEqual([])
  })

  it('accepts a valid name after an empty one was rejected', async () => {
    render(<Harness />)
    await userEvent.click(createButton())
    await userEvent.clear(nameInput())
    await userEvent.type(nameInput(), '{Enter}')
    expect(await screen.findByText('Вкажіть назву послуги')).toBeInTheDocument()

    await userEvent.type(nameInput(), 'Охорона{Enter}')

    await waitFor(() =>
      expect(
        screen.queryByText('Вкажіть назву послуги')
      ).not.toBeInTheDocument()
    )
    expect(screen.getByText('Охорона')).toBeInTheDocument()
    expect(formRef.getFieldValue('customServices')).toEqual([
      expect.objectContaining({ label: 'Охорона', isDraft: true }),
    ])
  })

  it('trims spaces around a confirmed name', async () => {
    render(<Harness />)

    await addDraft('  Охорона  ')

    expect(formRef.getFieldValue(['customServices', 0, 'label'])).toBe(
      'Охорона'
    )
  })

  it('keeps several new services side by side, each with its own price', async () => {
    render(<Harness />)

    await addDraft('Охорона')
    await addDraft('Вивіз снігу')
    const [first, second] = screen.getAllByRole('spinbutton')
    await userEvent.type(first, '100')
    await userEvent.type(second, '200')

    const { customServices } = await formRef.validateFields()
    expect(customServices).toEqual([
      expect.objectContaining({ label: 'Охорона', price: 100, isDraft: true }),
      expect.objectContaining({
        label: 'Вивіз снігу',
        price: 200,
        isDraft: true,
      }),
    ])
    expect(customServices[0]._id).not.toBe(customServices[1]._id)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does not accept two new services with the same name', async () => {
    render(<Harness />)
    await addDraft('Охорона')

    await userEvent.click(createButton())
    await waitFor(() => expect(nameInput()).toHaveFocus())
    await userEvent.keyboard('охорона{Enter}')

    expect(
      await screen.findByText('Послуга з такою назвою вже існує')
    ).toBeInTheDocument()
    expect(nameInput()).toBeInTheDocument()
  })

  it('blocks submitting while a new service has no price', async () => {
    render(<Harness />)
    await addDraft('Охорона')

    await expect(formRef.validateFields()).rejects.toBeTruthy()
    expect(await screen.findByText('Введіть значення')).toBeInTheDocument()
  })

  describe('creating from the search text', () => {
    it('adds the typed name as a ready new service, without the rename step', async () => {
      render(<Harness />)

      await userEvent.type(searchInput(), 'Охорона')
      await userEvent.click(
        screen.getByRole('button', { name: /Створити «Охорона»/ })
      )

      expect(formRef.getFieldValue('customServices')).toEqual([
        expect.objectContaining({ label: 'Охорона', isDraft: true }),
      ])
      expect(screen.getByText('Охорона')).toBeInTheDocument()
      expect(
        screen.queryByRole('textbox', { name: 'Назва нової послуги' })
      ).not.toBeInTheDocument()
      expect(searchInput()).toHaveValue('')
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('falls back to a plain "Нова послуга" when the text matches an existing service', async () => {
      render(<Harness />)

      await userEvent.type(searchInput(), ' прибирання ')

      expect(
        screen.queryByRole('button', { name: /Створити «/ })
      ).not.toBeInTheDocument()
      await userEvent.click(createButton())
      expect(nameInput()).toHaveValue('Нова послуга')
    })

    it('treats an already added new service as a match too', async () => {
      render(<Harness />)
      await addDraft('Охорона')

      await userEvent.type(searchInput(), 'ОХОРОНА')

      expect(
        screen.queryByRole('button', { name: /Створити «/ })
      ).not.toBeInTheDocument()
    })

    it('a service created from the search text can still be removed', async () => {
      render(<Harness />)
      await userEvent.type(searchInput(), 'Охорона')
      await userEvent.click(
        screen.getByRole('button', { name: /Створити «Охорона»/ })
      )

      await userEvent.click(
        screen.getByRole('button', { name: 'remove-Охорона' })
      )

      expect(formRef.getFieldValue('customServices')).toEqual([])
    })
  })

  describe('existing services keep working next to new ones', () => {
    it('adds an existing domain service with an empty price', async () => {
      render(<Harness />)

      await userEvent.click(
        screen.getByRole('button', { name: 'option: Прибирання' })
      )

      expect(formRef.getFieldValue('customServices')).toEqual([
        {
          _id: 'svc-1',
          label: 'Прибирання',
          fieldName: 'pribyrannia',
          price: null,
        },
      ])
      expect(screen.getByLabelText('Прибирання')).toBeInTheDocument()
    })

    it('shows a new service in the selector as a selected option', async () => {
      render(<Harness />)
      await addDraft('Охорона')

      expect(
        screen.getByRole('button', { name: 'option: Охорона' })
      ).toHaveAttribute('aria-pressed', 'true')
    })

    it('"Обрати всі" / "Скасувати вибір" leave new services in place', async () => {
      render(<Harness />)
      await addDraft('Охорона')

      await userEvent.click(screen.getByRole('button', { name: 'Обрати всі' }))
      expect(
        formRef.getFieldValue('customServices').map((s: any) => s.label)
      ).toEqual(['Прибирання', 'Охорона'])
      expect(formRef.getFieldValue('allServices')).toBe(true)

      await userEvent.click(
        screen.getByRole('button', { name: /Скасувати вибір/ })
      )
      expect(
        formRef.getFieldValue('customServices').map((s: any) => s.label)
      ).toEqual(['Охорона'])
      expect(formRef.getFieldValue('allServices')).toBe(false)
    })

    it('removes an existing service from the company', async () => {
      render(<Harness />)
      await userEvent.click(
        screen.getByRole('button', { name: 'option: Прибирання' })
      )

      await userEvent.click(
        screen.getByRole('button', { name: 'remove-Прибирання' })
      )

      expect(formRef.getFieldValue('customServices')).toEqual([])
    })
  })

  it('does not offer creation to non-admins', () => {
    mockUseGetCurrentUserQuery.mockReturnValue({
      data: { roles: [Roles.USER] },
    })
    render(<Harness />)

    expect(
      screen.queryByRole('button', { name: /Створити нову послугу/ })
    ).not.toBeInTheDocument()
  })
})
