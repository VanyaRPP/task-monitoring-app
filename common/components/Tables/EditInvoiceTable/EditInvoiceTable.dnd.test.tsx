import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Form } from 'antd'
import { EditInvoicesTable_unstable } from './index'

// Запам'ятовуємо onDragEnd, щоб імітувати перетягування: у jsdom немає
// розмітки, тому dnd-kit не може визначити, куди впав рядок.
const dnd: { onDragEnd?: (event: unknown) => void } = {}
jest.mock('@dnd-kit/core', () => {
  const actual = jest.requireActual('@dnd-kit/core')
  return {
    ...actual,
    DndContext: (props: { onDragEnd: (event: unknown) => void }) => {
      dnd.onDragEnd = props.onDragEnd
      return <actual.DndContext {...props} />
    },
  }
})

jest.mock('@common/api/customServicesApi/customServices.api', () => ({
  useGetCustomServicesByDomainQuery: () => ({
    data: { data: [] },
    isLoading: false,
  }),
}))

// Усі типи рядків, крім Custom, замінюємо порожніми заглушками.
// Усередині кожної фабрики свій власний компонент, щоб jest не скаржився
// на змінні, оголошені поза jest.mock.
jest.mock('./Maintenance', () => {
  const Empty = () => null
  return { Name: Empty, Amount: Empty, Price: Empty, Sum: Empty }
})
jest.mock('./Placing', () => {
  const Empty = () => null
  return { Name: Empty, Amount: Empty, Price: Empty, Sum: Empty }
})
jest.mock('./Inflicion', () => {
  const Empty = () => null
  return { Name: Empty, Amount: Empty, Price: Empty, Sum: Empty }
})
jest.mock('./GarbageCollector', () => {
  const Empty = () => null
  return { Name: Empty, Amount: Empty, Price: Empty, Sum: Empty }
})
jest.mock('./Electricity', () => {
  const Empty = () => null
  return { Name: Empty, Amount: Empty, Price: Empty, Sum: Empty }
})
jest.mock('./Water', () => {
  const Empty = () => null
  return { Name: Empty, Amount: Empty, Price: Empty, Sum: Empty }
})
jest.mock('./WaterPart', () => {
  const Empty = () => null
  return { Name: Empty, Amount: Empty, Price: Empty, Sum: Empty }
})
jest.mock('./Cleaning', () => {
  const Empty = () => null
  return { Name: Empty, Amount: Empty, Price: Empty, Sum: Empty }
})
jest.mock('./Discount', () => {
  const Empty = () => null
  return { Name: Empty, Amount: Empty, Price: Empty, Sum: Empty }
})

// Custom показує назву послуги з даних рядка, щоб було видно порядок.
jest.mock('./Custom', () => {
  const { Form } = require('antd')
  const Empty = () => null
  const Name = ({ record }: { record?: { name?: string } }) => (
    <span>{record?.name}</span>
  )
  const Amount = ({ name }: { name: number }) => (
    <Form.Item name={[name, 'amount']} noStyle>
      <input data-testid="amount" />
    </Form.Item>
  )
  return { Name, Amount, Price: Empty, Sum: Empty }
})

const makeInvoice = (names: string[]) =>
  names.map((name) => ({ type: 'custom', name, amount: 1, price: 10, sum: 10 }))

const renderTable = (names: string[]) => {
  const Wrapper = () => {
    const [form] = Form.useForm()
    return (
      <Form form={form} initialValues={{ invoice: makeInvoice(names) }}>
        <EditInvoicesTable_unstable form={form} editable domainId="d1" />
      </Form>
    )
  }
  return render(<Wrapper />)
}

// Повертає рядки таблиці як [номер у колонці «№», назва].
const readRows = () =>
  Array.from(document.querySelectorAll('tbody tr.ant-table-row')).map((tr) => {
    const cells = tr.querySelectorAll('td')
    return [cells[0].textContent, cells[1].textContent]
  })

// Ключі рядків Form.List: 0, 1, 2... відповідають початковому порядку.
const drag = (activeId: number, overId: number) =>
  act(() => dnd.onDragEnd({ active: { id: activeId }, over: { id: overId } }))

describe('EditInvoicesTable — drag-and-drop послуг', () => {
  it('змінює порядок через drag-and-drop', () => {
    renderTable(['Утримання', 'Розміщення', 'Знижка'])
    expect(readRows()).toEqual([
      ['1', 'Утримання'],
      ['2', 'Розміщення'],
      ['3', 'Знижка'],
    ])

    drag(1, 0) // «Розміщення» стає перед «Утримання»

    expect(readRows()).toEqual([
      ['1', 'Розміщення'],
      ['2', 'Утримання'],
      ['3', 'Знижка'],
    ])
  })
  it('переміщує з початку в кінець', () => {
    renderTable(['A', 'B', 'C', 'D'])

    drag(0, 3)

    expect(readRows()).toEqual([
      ['1', 'B'],
      ['2', 'C'],
      ['3', 'D'],
      ['4', 'A'],
    ])
  })

  it('переміщує з кінця на початок', () => {
    renderTable(['A', 'B', 'C', 'D'])

    drag(3, 0)

    expect(readRows()).toEqual([
      ['1', 'D'],
      ['2', 'A'],
      ['3', 'B'],
      ['4', 'C'],
    ])
  })

  it('переміщує між двома іншими', () => {
    renderTable(['A', 'B', 'C', 'D'])

    drag(0, 2)

    expect(readRows()).toEqual([
      ['1', 'B'],
      ['2', 'C'],
      ['3', 'A'],
      ['4', 'D'],
    ])
  })

  it('після зміни порядку всі послуги на місці, без дублікатів', () => {
    const names = ['A', 'B', 'C', 'D', 'E']
    renderTable(names)

    drag(4, 1)
    drag(0, 3)

    const after = readRows().map(([, name]) => name)
    expect(after).toHaveLength(names.length)
    expect(new Set(after).size).toBe(names.length)
    expect([...after].sort()).toEqual([...names].sort())
  })

  it('оновлює номер у колонці «№» після кожного переміщення', () => {
    renderTable(['A', 'B', 'C'])

    drag(2, 0)
    expect(readRows().map(([num]) => num)).toEqual(['1', '2', '3'])

    drag(0, 1)
    expect(readRows().map(([num]) => num)).toEqual(['1', '2', '3'])
  })

  it('нічого не змінює, якщо рядок скинули на себе або поза таблицею', () => {
    renderTable(['A', 'B', 'C'])

    drag(1, 1)
    act(() => dnd.onDragEnd({ active: { id: 1 }, over: null }))

    expect(readRows().map(([, name]) => name)).toEqual(['A', 'B', 'C'])
  })
  it('редагування поля і видалення рядка працюють після зміни порядку', () => {
    renderTable(['A', 'B', 'C'])

    drag(2, 0) // порядок: C, A, B
    expect(readRows().map(([, name]) => name)).toEqual(['C', 'A', 'B'])

    // міняємо кількість у першому рядку (це «C»)
    const amounts = () =>
      screen
        .getAllByTestId('amount')
        .map((input) => (input as HTMLInputElement).value)
    fireEvent.change(screen.getAllByTestId('amount')[0], {
      target: { value: '5' },
    })
    expect(amounts()).toEqual(['5', '1', '1'])

    // видаляємо другий рядок («A»)
    fireEvent.click(screen.getAllByLabelText('minus-circle')[1])

    expect(readRows()).toEqual([
      ['1', 'C'],
      ['2', 'B'],
    ])
    expect(amounts()).toEqual(['5', '1'])
  })
})
