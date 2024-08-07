import { Providers } from '@components/Providers'
import '@styles/globals.scss'
import '@styles/reset.scss'
import NextNProgress from 'nextjs-progressbar'

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <Providers pageProps={pageProps}>
      <NextNProgress height={2} showOnShallow={false} />
      <Component {...pageProps} />
    </Providers>
  )
}
