import { Providers_pages } from '@components/Providers'
import NextNProgress from 'nextjs-progressbar'
import Head from 'next/head'
import { appWithTranslation } from 'next-i18next'

import '../common/lib/i18n.ts'

import '@styles/globals.scss'
import '@styles/reset.scss'

function MyApp({ Component, pageProps }) {
  return (
    <Providers_pages pageProps={pageProps}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <NextNProgress height={2} showOnShallow={false} />
      <Component {...pageProps} />
    </Providers_pages>
  )
}

export default appWithTranslation(MyApp)
