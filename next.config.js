const { i18n } = require('./next-i18next.config')
// next-pwa has been unmaintained since 2022; @ducanh2912/next-pwa is the
// maintained fork with the same plugin shape. `skipWaiting` moved under
// `workboxOptions`, and the CJS entry point exposes the plugin as `.default`.
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  workboxOptions: {
    skipWaiting: true,
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  // Chromium itself is fetched at runtime from a remote pack via
  // @sparticuz/chromium-min (see utils/pdf/bufferGenerators.ts), so we only
  // need to keep these out of the webpack bundle — no asset tracing required.
  // Promoted out of `experimental` in Next 15.
  serverExternalPackages: ['@sparticuz/chromium-min', 'puppeteer-core'],
  transpilePackages: [
    'antd',
    '@ant-design/icons',
    '@ant-design/icons-svg',
    '@ant-design/cssinjs',
    '@ant-design/compatible',
    '@ant-design/plots',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-tree',
    'rc-table',
    'rc-tooltip',
    'rc-cascader',
    'rc-checkbox',
    'rc-dropdown',
    'rc-field-form',
    'rc-input',
    'rc-input-number',
    'rc-mentions',
    'rc-menu',
    'rc-motion',
    'rc-notification',
    'rc-overflow',
    'rc-progress',
    'rc-rate',
    'rc-resize-observer',
    'rc-segmented',
    'rc-select',
    'rc-slider',
    'rc-steps',
    'rc-switch',
    'rc-textarea',
    'rc-tree-select',
    'rc-upload',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
    ],
  },
}

module.exports = withPWA(nextConfig)
