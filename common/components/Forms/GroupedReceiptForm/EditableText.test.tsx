import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import EditableText from './EditableText'
import { InvoiceEditContext } from './InvoiceEditContext'

jest.mock('./EditableText.module.scss', () => ({
  field: 'field',
  textarea: 'textarea',
}))

describe('EditableText', () => {
  it('renders defaultValue statically without an edit context', () => {
    render(<EditableText valuePath="invoiceTitle" defaultValue="INVOICE" />)
    expect(screen.getByText('INVOICE')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders children (not the input) in read mode', () => {
    render(
      <EditableText valuePath="providerDescription" defaultValue="raw">
        <span>structured</span>
      </EditableText>
    )
    expect(screen.getByText('structured')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows an input seeded from defaultValue and writes via setValue in edit mode', () => {
    const setValue = jest.fn()
    render(
      <InvoiceEditContext.Provider
        value={{
          editMode: true,
          lang: 'uk',
          getValue: () => undefined,
          setValue,
        }}
      >
        <EditableText valuePath="invoiceTitle" defaultValue="РАХУНОК" />
      </InvoiceEditContext.Provider>
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('РАХУНОК')
    fireEvent.change(input, { target: { value: 'НАКЛАДНА' } })
    expect(setValue).toHaveBeenCalledWith('invoiceTitle', 'НАКЛАДНА')
  })

  it('prefers the draft value over defaultValue in edit mode', () => {
    render(
      <InvoiceEditContext.Provider
        value={{
          editMode: true,
          lang: 'uk',
          getValue: () => 'DRAFT',
          setValue: jest.fn(),
        }}
      >
        <EditableText valuePath="invoiceTitle" defaultValue="РАХУНОК" />
      </InvoiceEditContext.Provider>
    )
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
      'DRAFT'
    )
  })

  it('round-trips a label edit through stateful labels overrides (editor wiring)', () => {
    // Mirrors InvoiceTemplateEditor's editCtx: getLabel/setLabel backed by
    // overrides.labels state. Proves a fieldKey input actually mutates and
    // reflects the typed value across re-renders (the "labels don't change?" Q).
    const Harness = () => {
      const [labels, setLabels] = useState<
        Record<string, { uk?: string; en?: string }>
      >({})
      return (
        <InvoiceEditContext.Provider
          value={{
            editMode: true,
            lang: 'uk',
            getLabel: (key) => labels[key]?.uk,
            setLabel: (key, value) =>
              setLabels((prev) => ({
                ...prev,
                [key]: { ...prev[key], uk: value },
              })),
          }}
        >
          <EditableText
            fieldKey="paymentInfo.header"
            defaultValue="ПЛАТІЖНІ ДАНІ:"
          />
        </InvoiceEditContext.Provider>
      )
    }
    render(<Harness />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('ПЛАТІЖНІ ДАНІ:')
    fireEvent.change(input, { target: { value: 'РЕКВІЗИТИ:' } })
    expect(input.value).toBe('РЕКВІЗИТИ:')
  })

  it('writes label overrides by key via setLabel', () => {
    const setLabel = jest.fn()
    render(
      <InvoiceEditContext.Provider
        value={{
          editMode: true,
          lang: 'en',
          getLabel: () => undefined,
          setLabel,
        }}
      >
        <EditableText fieldKey="provider.title" defaultValue="Provider" />
      </InvoiceEditContext.Provider>
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Vendor' },
    })
    expect(setLabel).toHaveBeenCalledWith('provider.title', 'Vendor')
  })
})
