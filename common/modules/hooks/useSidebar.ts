'use client'

import { setCollapse, toggleCollapse } from '@modules/store/sidebarSlice'
import { AppDispatch, RootState } from '@modules/store/store'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const useCollapse = () => {
  const dispatch: AppDispatch = useDispatch()
  const collapsed = useSelector((state: RootState) => state.sidebar.collapsed)

  const toggleCollapsed = useCallback(() => {
    dispatch(toggleCollapse())
  }, [dispatch])

  const setCollapsed = useCallback(
    (value: boolean) => {
      dispatch(setCollapse(value))
    },
    [dispatch]
  )

  return { collapsed, toggleCollapsed, setCollapsed }
}

export default useCollapse
