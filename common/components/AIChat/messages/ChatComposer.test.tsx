import React, { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatComposer from './ChatComposer'

interface HarnessProps {
  isLoading?: boolean
  onSend?: (text: string) => void
  onStop?: () => void
}

const Harness: React.FC<HarnessProps> = ({
  isLoading = false,
  onSend = jest.fn(),
  onStop = jest.fn(),
}) => {
  const [value, setValue] = useState('')
  return (
    <ChatComposer
      value={value}
      onChange={setValue}
      onSend={() => {
        onSend(value)
        setValue('')
      }}
      onStop={onStop}
      isLoading={isLoading}
    />
  )
}

const field = (): HTMLTextAreaElement =>
  screen.getByRole('textbox', { name: 'Повідомлення AI-помічнику' })

describe('ChatComposer', () => {
  it('це багаторядкове поле', () => {
    render(<Harness />)
    expect(field().tagName).toBe('TEXTAREA')
  })

  it('Enter надсилає повідомлення', async () => {
    const onSend = jest.fn()
    render(<Harness onSend={onSend} />)

    await userEvent.type(field(), 'Привіт{Enter}')

    expect(onSend).toHaveBeenCalledWith('Привіт')
    expect(field()).toHaveValue('')
  })

  it('Shift+Enter переносить рядок і не надсилає', async () => {
    const onSend = jest.fn()
    render(<Harness onSend={onSend} />)

    await userEvent.type(field(), 'Рядок 1{Shift>}{Enter}{/Shift}Рядок 2')

    expect(onSend).not.toHaveBeenCalled()
    expect(field()).toHaveValue('Рядок 1\nРядок 2')
  })

  it('не надсилає порожнє повідомлення чи пробіли', async () => {
    const onSend = jest.fn()
    render(<Harness onSend={onSend} />)

    expect(screen.getByRole('button', { name: 'Надіслати' })).toBeDisabled()
    await userEvent.type(field(), '   {Enter}')

    expect(onSend).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Надіслати' })).toBeDisabled()
  })

  it('кнопка стає активною, коли є текст', async () => {
    const onSend = jest.fn()
    render(<Harness onSend={onSend} />)

    await userEvent.type(field(), 'Борги')
    const send = screen.getByRole('button', { name: 'Надіслати' })
    expect(send).toBeEnabled()

    await userEvent.click(send)
    expect(onSend).toHaveBeenCalledWith('Борги')
  })

  it('Enter під час набору через IME не надсилає', () => {
    const onSend = jest.fn()
    render(<Harness onSend={onSend} />)
    fireEvent.change(field(), { target: { value: 'текст' } })

    fireEvent.keyDown(field(), { key: 'Enter', isComposing: true })

    expect(onSend).not.toHaveBeenCalled()
  })

  it('під час генерації показує «Зупинити», а Enter не надсилає', async () => {
    const onSend = jest.fn()
    const onStop = jest.fn()
    render(<Harness isLoading onSend={onSend} onStop={onStop} />)

    // Typing stays possible while the answer is generated.
    await userEvent.type(field(), 'Наступне{Enter}')
    expect(onSend).not.toHaveBeenCalled()
    expect(field()).toHaveValue('Наступне')
    expect(
      screen.queryByRole('button', { name: 'Надіслати' })
    ).not.toBeInTheDocument()

    await userEvent.click(
      screen.getByRole('button', { name: 'Зупинити генерацію' })
    )
    expect(onStop).toHaveBeenCalledTimes(1)
  })
})
