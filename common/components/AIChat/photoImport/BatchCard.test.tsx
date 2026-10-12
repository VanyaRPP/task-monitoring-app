import { render, screen } from '@testing-library/react'
import BatchCard from './BatchCard'
import type { IDocumentBatch } from './useDocumentImports'

jest.mock('./StatementImportCard', () => ({
  __esModule: true,
  default: ({ group }: any) => <div>картка {group.key}</div>,
}))

const batch = (over: Partial<IDocumentBatch> = {}): IDocumentBatch => ({
  id: 'b1',
  photos: [
    { id: 'p1', name: '1.jpg', status: 'done', stripsDone: 4, stripsTotal: 4 },
    {
      id: 'p2',
      name: '2.jpg',
      status: 'reading',
      stripsDone: 1,
      stripsTotal: 4,
    },
    {
      id: 'p3',
      name: '3.jpg',
      status: 'queued',
      stripsDone: 0,
      stripsTotal: 0,
    },
  ],
  done: false,
  groups: [],
  cards: {},
  ...over,
})

describe('BatchCard', () => {
  it('поки читає — прогрес кожного фото', () => {
    render(<BatchCard batch={batch()} onCardChange={jest.fn()} />)

    expect(screen.getByText('Читаю 3 фото…')).toBeInTheDocument()
    expect(screen.getByText('прочитано')).toBeInTheDocument()
    expect(screen.getByText('частина 2 з 4')).toBeInTheDocument()
    expect(screen.getByText('у черзі')).toBeInTheDocument()
  })

  it('хвилинний і денний ліміти пояснює по-різному', () => {
    const { rerender } = render(
      <BatchCard
        batch={batch({ resumeAt: Date.now() + 40_000 })}
        onCardChange={jest.fn()}
      />
    )
    expect(screen.getByText(/ліміт на хвилину вичерпано/)).toBeInTheDocument()

    rerender(
      <BatchCard
        batch={batch({ resumeAt: Date.now() + 20 * 60_000 })}
        onCardChange={jest.fn()}
      />
    )
    expect(
      screen.getByText(/Денний ліміт .* приблизно через 20 хв/)
    ).toBeInTheDocument()
  })

  it('після читання — картка на кожну квартиру і що не вдалося', () => {
    render(
      <BatchCard
        batch={batch({
          done: true,
          photos: [
            {
              id: 'p1',
              name: '1.jpg',
              status: 'done',
              stripsDone: 4,
              stripsTotal: 4,
            },
            {
              id: 'p2',
              name: 'кіт.jpg',
              status: 'unrecognized',
              stripsDone: 0,
              stripsTotal: 0,
            },
          ],
          groups: [{ key: 'g1' } as any],
          cards: { g1: {} },
        })}
        onCardChange={jest.fn()}
      />
    )

    expect(screen.getByText('картка g1')).toBeInTheDocument()
    expect(
      screen.getByText(/кіт.jpg: не схоже на таблицю боргу/)
    ).toBeInTheDocument()
  })

  it('без жодної таблиці — пояснює, що вміє читати', () => {
    render(
      <BatchCard
        batch={batch({ done: true, photos: [] })}
        onCardChange={jest.fn()}
      />
    )

    expect(
      screen.getByText(/Не знайшов на фото таблиці боргу/)
    ).toBeInTheDocument()
  })

  it('після перезавантаження сторінки фото вже немає — так і каже', () => {
    render(<BatchCard batch={undefined} onCardChange={jest.fn()} />)

    expect(screen.getByText(/надішліть їх ще раз/)).toBeInTheDocument()
  })
})
