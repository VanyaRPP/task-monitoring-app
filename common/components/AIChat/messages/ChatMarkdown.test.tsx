import React from 'react'
import { render, screen } from '@testing-library/react'
import ChatMarkdown from './ChatMarkdown'

const renderMarkdown = (text: string) => render(<ChatMarkdown text={text} />)

describe('ChatMarkdown', () => {
  it('показує жирний і курсив без службових символів', () => {
    const { container } = renderMarkdown(
      'Вкажіть **Назву компанії** та *адресу*'
    )

    expect(screen.getByText('Назву компанії').tagName).toBe('STRONG')
    expect(screen.getByText('адресу').tagName).toBe('EM')
    expect(container.textContent).not.toContain('**')
  })

  it('рендерить заголовки різних рівнів', () => {
    renderMarkdown('# Перший\n\n## Другий\n\n### Третій')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Перший'
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Другий'
    )
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
      'Третій'
    )
  })

  it('рендерить нумеровані та марковані списки', () => {
    const { container } = renderMarkdown(
      '1. Відкрити\n2. Зберегти\n\n- Борг\n- Оплата'
    )

    expect(container.querySelectorAll('ol > li')).toHaveLength(2)
    expect(container.querySelectorAll('ul > li')).toHaveLength(2)
  })

  it('внутрішні посилання відкриваються в застосунку, зовнішні - у новій вкладці', () => {
    renderMarkdown('[Платежі](/payment) і [Docs](https://example.com/a)')

    const internal = screen.getByRole('link', { name: 'Платежі' })
    expect(internal).toHaveAttribute('href', '/payment')
    expect(internal).not.toHaveAttribute('target')

    const external = screen.getByRole('link', { name: 'Docs' })
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('не робить посиланням javascript: URL', () => {
    renderMarkdown('[клік](javascript:alert(1))')

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('клік')).toBeInTheDocument()
  })

  it('показує сирий HTML як текст і не виконує його', () => {
    const { container } = renderMarkdown(
      'Текст <script>window.hacked = true</script> <img src=x onerror="alert(1)">'
    )

    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('img')).toBeNull()
    expect(container.textContent).toContain('<script>')
  })

  it('не завантажує зображення з відповіді, а показує посилання', () => {
    const { container } = renderMarkdown('![схема](https://example.com/x.png)')

    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByRole('link', { name: 'схема' })).toHaveAttribute(
      'href',
      'https://example.com/x.png'
    )
  })

  it('підсвічує синтаксис у блоці коду', () => {
    const { container } = renderMarkdown('```ts\nconst total: number = 42\n```')

    expect(screen.getByText('ts')).toBeInTheDocument()
    expect(container.querySelector('pre')).toHaveTextContent(
      'const total: number = 42'
    )
    // The highlighter splits keywords into their own spans.
    expect(screen.getByText('const').tagName).toBe('SPAN')
    expect(
      screen.getByRole('button', { name: 'Копіювати код' })
    ).toBeInTheDocument()
  })

  it('показує код невідомою мовою без підсвічування', () => {
    const { container } = renderMarkdown('```\nplain text\n```')

    expect(container.querySelector('pre')).toHaveTextContent('plain text')
  })

  it('кладе таблицю в контейнер з горизонтальною прокруткою', () => {
    renderMarkdown('| Компанія | Борг |\n| --- | --- |\n| ТОВ Альфа | 100 |')

    const region = screen.getByRole('region', { name: 'Таблиця' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region.querySelector('table')).not.toBeNull()
    expect(
      screen.getByRole('columnheader', { name: 'Компанія' })
    ).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'ТОВ Альфа' })).toBeInTheDocument()
  })
})
