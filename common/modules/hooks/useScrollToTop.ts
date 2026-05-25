'use client'

import { AppRoutes } from '@utils/constants'
import { usePathname, useRouter } from 'next/navigation'
import { MouseEvent } from 'react'

export const useScrollToTop = () => {
  const pathname = usePathname()
  const router = useRouter()

  const findScrollable = (el: Element | null): HTMLElement | null => {
    let cur: Element | null = el
    while (cur && cur !== document.documentElement) {
      const style = window.getComputedStyle(cur)
      const overflowY = style.overflowY
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        cur.scrollHeight > cur.clientHeight
      ) {
        return cur as HTMLElement
      }
      cur = cur.parentElement
    }
    return (
      (document.scrollingElement as HTMLElement) || document.documentElement
    )
  }

  const scrollToTop = (e?: MouseEvent) => {
    if (e) e.preventDefault()

    const content = document.querySelector('.ant-layout-content')
    const target = findScrollable(content)

    if (target && 'scrollTo' in target) {
      target.scrollTo({ top: 0, behavior: 'smooth' })
      window.requestAnimationFrame(() =>
        window.scrollTo({ top: 0, behavior: 'smooth' })
      )
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNavigateHome = (e?: MouseEvent) => {
    if (pathname === AppRoutes.INDEX) {
      scrollToTop(e)
    } else {
      router.push(AppRoutes.INDEX)
    }
  }

  return { scrollToTop, handleNavigateHome }
}
