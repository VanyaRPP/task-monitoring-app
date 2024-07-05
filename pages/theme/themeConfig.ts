import type { ThemeConfig } from 'antd'

export const lightTheme: ThemeConfig = {
  components: {
    Layout: {
      algorithm: true,
      headerBg: 'rgba(0, 0, 0, 0)',
      headerColor: 'rgba(0, 0, 0, 0)',
    },
  },
  token: {
    fontSize: 16,
    borderRadius: 8,
    colorPrimary: '#722ed1',
    colorInfo: '#722ed1',
  },
}
