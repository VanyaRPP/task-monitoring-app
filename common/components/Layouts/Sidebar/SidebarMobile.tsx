'use client'

import { Drawer } from 'antd'
import { useState } from 'react'
import { Sidebar } from '../Sidebar'

export const SidebarMobile: React.FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="left"
        width={240}
      >
        <Sidebar />
      </Drawer>
    </>
  )
}