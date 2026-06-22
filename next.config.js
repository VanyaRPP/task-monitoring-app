const { i18n } = require('./next-i18next.config')
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  experimental: {
    serverComponentsExternalPackages: [
      '@sparticuz/chromium',
      '@sparticuz/chromium-min',
      'puppeteer-core',
    ],
    // Chromium's binary/library assets are loaded at runtime via fs, so Next's
    // file tracing misses them and the serverless function ships without
    // libnspr4.so etc. Force the @sparticuz/chromium assets into every API
    // function so the bundled-binary path works on Vercel/Lambda.
    outputFileTracingIncludes: {
      '/api/**': ['./node_modules/@sparticuz/chromium/**'],
    },
  },
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
