import { act, fireEvent, render, screen } from '@testing-library/react'
import InvoiceTemplateEditor from './index'

const mockCreate = jest.fn()
const mockUpdate = jest.fn()

jest.mock('./style.module.scss', () => ({}))

// Heavy render deps are irrelevant to the save logic — stub them out so the
// editor mounts without next/dynamic templates or a redux store.
jest.mock('@components/Forms/GroupedReceiptForm/templateMap', () => {
  const React = require('react')
  const marker = (id: string) => {
    const M = () => React.createElement('div', { 'data-testid': id })
    M.displayName = id
    return M
  }
  return {
    templateMap: {
      classic: marker('tpl-classic'),
      olimp: marker('tpl-olimp'),
      ledger: marker('tpl-ledger'),
      official: marker('tpl-official'),
    },
  }
})
jest.mock(
  '@components/Forms/GroupedReceiptForm/useReceiptTemplateProps',
  () => ({ useReceiptTemplateProps: () => ({}) })
)
jest.mock('@common/api/invoiceTemplateApi/invoiceTemplate.api', () => ({
  useCreateInvoiceTemplateMutation: () => [mockCreate],
  useUpdateInvoiceTemplateMutation: () => [mockUpdate],
}))

const customTemplate = {
  _id: 'c1',
  name: 'Custom',
  baseTemplateKey: 'olimp',
  providerDescription: '',
  receiverDescription: '',
  isBuiltIn: false,
  overrides: {},
} as any

describe('InvoiceTemplateEditor auto-save (saveIfDirty)', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockUpdate.mockReset()
  })

  const dirtyByRenamingTemplate = (value: string) =>
    fireEvent.change(screen.getByPlaceholderText('Назва шаблону'), {
      target: { value },
    })

  it('returns null and persists nothing when the draft is unchanged', async () => {
    let saver: () => Promise<string | null> = async () => null
    render(
      <InvoiceTemplateEditor
        domainId="d1"
        baseTemplateKey="olimp"
        registerSaver={(fn) => {
          if (fn) saver = fn
        }}
      />
    )

    const result = await saver()
    expect(result).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('creates a new template (from a builtin base) and returns its id when dirty', async () => {
    mockCreate.mockResolvedValue({ data: { data: { _id: 'new1', name: 'X' } } })
    let saver: () => Promise<string | null> = async () => null
    render(
      <InvoiceTemplateEditor
        domainId="d1"
        baseTemplateKey="olimp"
        defaultName="Мій шаблон"
        registerSaver={(fn) => {
          if (fn) saver = fn
        }}
      />
    )

    dirtyByRenamingTemplate('Мій шаблон 2')

    let id: string | null = null
    await act(async () => {
      id = await saver()
    })

    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(id).toBe('new1')
  })

  it('re-seeds the base layout when the edited template resolves after mount', () => {
    // Mount as a builtin base (no existingTemplate yet), then let a just-saved
    // custom copy (a different layout) arrive without a key change — the editor
    // must switch layouts instead of staying on the mount-time one.
    const { rerender } = render(
      <InvoiceTemplateEditor
        domainId="d1"
        baseTemplateKey="olimp"
        existingTemplate={null}
      />
    )
    expect(screen.getByTestId('tpl-olimp')).toBeInTheDocument()

    rerender(
      <InvoiceTemplateEditor
        domainId="d1"
        baseTemplateKey="olimp"
        existingTemplate={
          {
            _id: 'x',
            name: 'Copy',
            baseTemplateKey: 'ledger',
            providerDescription: '',
            receiverDescription: '',
            isBuiltIn: false,
            overrides: {},
          } as any
        }
      />
    )
    expect(screen.getByTestId('tpl-ledger')).toBeInTheDocument()
    expect(screen.queryByTestId('tpl-olimp')).not.toBeInTheDocument()
  })

  it('updates the active custom template and returns its id when dirty', async () => {
    mockUpdate.mockResolvedValue({ data: { data: { _id: 'c1', name: 'X' } } })
    let saver: () => Promise<string | null> = async () => null
    render(
      <InvoiceTemplateEditor
        domainId="d1"
        existingTemplate={customTemplate}
        registerSaver={(fn) => {
          if (fn) saver = fn
        }}
      />
    )

    dirtyByRenamingTemplate('Custom 2')

    let id: string | null = null
    await act(async () => {
      id = await saver()
    })

    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockCreate).not.toHaveBeenCalled()
    expect(id).toBe('c1')
  })
})
