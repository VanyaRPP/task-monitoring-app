import { useState } from 'react'

interface IView {
  focused?: string
  hidden: string[]
}

const DEFAULT_VIEW: IView = { hidden: [] }

export interface ISpotlightView {
  /** The key of the enlarged card, none in the default grid. */
  focused?: string
  hidden: string[]
  isChanged: boolean
  focus: (key?: string) => void
  hide: (key: string) => void
  show: (key: string) => void
  reset: () => void
}

/**
 * Which card of a board is enlarged and which ones are put away. Every
 * `viewKey` keeps a view of its own, for as long as the board is on the page.
 */
const useSpotlightView = (viewKey: string): ISpotlightView => {
  const [views, setViews] = useState<Record<string, IView>>({})
  const { focused, hidden } = views[viewKey] ?? DEFAULT_VIEW

  const update = (change: (view: IView) => IView) =>
    setViews((prev) => ({
      ...prev,
      [viewKey]: change(prev[viewKey] ?? DEFAULT_VIEW),
    }))

  return {
    focused,
    hidden,
    isChanged: Boolean(focused) || hidden.length > 0,
    focus: (key) => update((view) => ({ ...view, focused: key })),
    hide: (key) =>
      update((view) => ({
        focused: view.focused === key ? undefined : view.focused,
        hidden: [...view.hidden, key],
      })),
    show: (key) =>
      update((view) => ({
        ...view,
        hidden: view.hidden.filter((item) => item !== key),
      })),
    reset: () => update(() => DEFAULT_VIEW),
  }
}

export default useSpotlightView
