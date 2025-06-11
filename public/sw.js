if (!self.define) {
  let e,
    s = {}
  const c = (c, a) => (
    (c = new URL(c + '.js', a).href),
    s[c] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script')
          ;(e.src = c), (e.onload = s), document.head.appendChild(e)
        } else (e = c), importScripts(c), s()
      }).then(() => {
        let e = s[c]
        if (!e) throw new Error(`Module ${c} didn’t register its module`)
        return e
      })
  )
  self.define = (a, n) => {
    const i =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href
    if (s[i]) return
    let t = {}
    const r = (e) => c(e, i),
      d = { module: { uri: i }, exports: t, require: r }
    s[i] = Promise.all(a.map((e) => d[e] || r(e))).then((e) => (n(...e), t))
  }
}
define(['./workbox-1bb06f5e'], function (e) {
  'use strict'
  importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/Preliminary_account.png',
          revision: '397ad9914abdd4e97209eb969e9d8726',
        },
        {
          url: '/_next/static/chunks/1187-78b828a6199c92ac.js',
          revision: '78b828a6199c92ac',
        },
        {
          url: '/_next/static/chunks/1532-7f3fb2aa580e3e87.js',
          revision: '7f3fb2aa580e3e87',
        },
        {
          url: '/_next/static/chunks/1664-7246e58924eb0118.js',
          revision: '7246e58924eb0118',
        },
        {
          url: '/_next/static/chunks/1777-bc405a2dcadadce1.js',
          revision: 'bc405a2dcadadce1',
        },
        {
          url: '/_next/static/chunks/1866-9fadae17ad7f59bc.js',
          revision: '9fadae17ad7f59bc',
        },
        {
          url: '/_next/static/chunks/2209.a7bd629b86a5cf31.js',
          revision: 'a7bd629b86a5cf31',
        },
        {
          url: '/_next/static/chunks/2531-b35612136b4dd566.js',
          revision: 'b35612136b4dd566',
        },
        {
          url: '/_next/static/chunks/2555-2fba64d21f846dca.js',
          revision: '2fba64d21f846dca',
        },
        {
          url: '/_next/static/chunks/29107295.79b81857c2f2608e.js',
          revision: '79b81857c2f2608e',
        },
        {
          url: '/_next/static/chunks/3500-e8250e48122290d9.js',
          revision: 'e8250e48122290d9',
        },
        {
          url: '/_next/static/chunks/355a6ca7.bb555863ae0c80f0.js',
          revision: 'bb555863ae0c80f0',
        },
        {
          url: '/_next/static/chunks/3638-4c6a0a54759a4648.js',
          revision: '4c6a0a54759a4648',
        },
        {
          url: '/_next/static/chunks/3740-f4e50a0bed73a8dd.js',
          revision: 'f4e50a0bed73a8dd',
        },
        {
          url: '/_next/static/chunks/3818-736a50269543327b.js',
          revision: '736a50269543327b',
        },
        {
          url: '/_next/static/chunks/4266-f9d6a3d809b0b452.js',
          revision: 'f9d6a3d809b0b452',
        },
        {
          url: '/_next/static/chunks/4734-5fc13d70122623eb.js',
          revision: '5fc13d70122623eb',
        },
        {
          url: '/_next/static/chunks/4754.c71cfeac80c61b86.js',
          revision: 'c71cfeac80c61b86',
        },
        {
          url: '/_next/static/chunks/4799-b94cef50ca07df27.js',
          revision: 'b94cef50ca07df27',
        },
        {
          url: '/_next/static/chunks/4996-c972545c3f487b92.js',
          revision: 'c972545c3f487b92',
        },
        {
          url: '/_next/static/chunks/5015-aa595d790cafe24a.js',
          revision: 'aa595d790cafe24a',
        },
        {
          url: '/_next/static/chunks/5090-9c20156f18b378c4.js',
          revision: '9c20156f18b378c4',
        },
        {
          url: '/_next/static/chunks/5400-abeb98cb9dc9453e.js',
          revision: 'abeb98cb9dc9453e',
        },
        {
          url: '/_next/static/chunks/548-32f3bf2047ef5a62.js',
          revision: '32f3bf2047ef5a62',
        },
        {
          url: '/_next/static/chunks/597-3e6dc7b1182a59ea.js',
          revision: '3e6dc7b1182a59ea',
        },
        {
          url: '/_next/static/chunks/613-0a56ac88425bf4ce.js',
          revision: '0a56ac88425bf4ce',
        },
        {
          url: '/_next/static/chunks/6697-952b2b3b070b3a17.js',
          revision: '952b2b3b070b3a17',
        },
        {
          url: '/_next/static/chunks/6814153d-3fbe17f40548019b.js',
          revision: '3fbe17f40548019b',
        },
        {
          url: '/_next/static/chunks/6818-e5de853ee90be6af.js',
          revision: 'e5de853ee90be6af',
        },
        {
          url: '/_next/static/chunks/7119-71c96267cdb14ece.js',
          revision: '71c96267cdb14ece',
        },
        {
          url: '/_next/static/chunks/7265-8852ed21ca6a121e.js',
          revision: '8852ed21ca6a121e',
        },
        {
          url: '/_next/static/chunks/7587-7490a4db82f7d8fe.js',
          revision: '7490a4db82f7d8fe',
        },
        {
          url: '/_next/static/chunks/779-de5477642c89516e.js',
          revision: 'de5477642c89516e',
        },
        {
          url: '/_next/static/chunks/8040-97751081e5feab02.js',
          revision: '97751081e5feab02',
        },
        {
          url: '/_next/static/chunks/8154-9c55ba0085816b1b.js',
          revision: '9c55ba0085816b1b',
        },
        {
          url: '/_next/static/chunks/8331-d8d5fba372556cba.js',
          revision: 'd8d5fba372556cba',
        },
        {
          url: '/_next/static/chunks/8549-6333da8306f9a9bd.js',
          revision: '6333da8306f9a9bd',
        },
        {
          url: '/_next/static/chunks/8799-ff54de27ed452d1b.js',
          revision: 'ff54de27ed452d1b',
        },
        {
          url: '/_next/static/chunks/8916-d9f9620b3b83b749.js',
          revision: 'd9f9620b3b83b749',
        },
        {
          url: '/_next/static/chunks/9368.c230202411c07d95.js',
          revision: 'c230202411c07d95',
        },
        {
          url: '/_next/static/chunks/9676-913c4c92ee3ced95.js',
          revision: '913c4c92ee3ced95',
        },
        {
          url: '/_next/static/chunks/ea88be26-21fe265b1bc4f005.js',
          revision: '21fe265b1bc4f005',
        },
        {
          url: '/_next/static/chunks/ee8b1517-841a53ee56161621.js',
          revision: '841a53ee56161621',
        },
        {
          url: '/_next/static/chunks/framework-f0878674c9b0c928.js',
          revision: 'f0878674c9b0c928',
        },
        {
          url: '/_next/static/chunks/main-eed7fc79f0c7b7c5.js',
          revision: 'eed7fc79f0c7b7c5',
        },
        {
          url: '/_next/static/chunks/pages/404-11fd45dea066ed71.js',
          revision: '11fd45dea066ed71',
        },
        {
          url: '/_next/static/chunks/pages/_app-8defb73234dd91aa.js',
          revision: '8defb73234dd91aa',
        },
        {
          url: '/_next/static/chunks/pages/_error-e4216aab802f5810.js',
          revision: 'e4216aab802f5810',
        },
        {
          url: '/_next/static/chunks/pages/auth/signin-2562dc7c85802533.js',
          revision: '2562dc7c85802533',
        },
        {
          url: '/_next/static/chunks/pages/auth/signup-4f7c9597cc5be8df.js',
          revision: '4f7c9597cc5be8df',
        },
        {
          url: '/_next/static/chunks/pages/auth/verify-request-a9d56e0e922c8596.js',
          revision: 'a9d56e0e922c8596',
        },
        {
          url: '/_next/static/chunks/pages/bank-e86bcdd8ebfb84dc.js',
          revision: 'e86bcdd8ebfb84dc',
        },
        {
          url: '/_next/static/chunks/pages/contacts-e00446dd9c1ead72.js',
          revision: 'e00446dd9c1ead72',
        },
        {
          url: '/_next/static/chunks/pages/domain-ec0be8f91598362f.js',
          revision: 'ec0be8f91598362f',
        },
        {
          url: '/_next/static/chunks/pages/index-e08c73bc25532406.js',
          revision: 'e08c73bc25532406',
        },
        {
          url: '/_next/static/chunks/pages/payment-c37389a790465f39.js',
          revision: 'c37389a790465f39',
        },
        {
          url: '/_next/static/chunks/pages/payment/bulk-b8accd6df729c1f9.js',
          revision: 'b8accd6df729c1f9',
        },
        {
          url: '/_next/static/chunks/pages/payment/chart-dc9ed14c34ea0b00.js',
          revision: 'dc9ed14c34ea0b00',
        },
        {
          url: '/_next/static/chunks/pages/payment/profit-8c7e6147663329f4.js',
          revision: '8c7e6147663329f4',
        },
        {
          url: '/_next/static/chunks/pages/premium-06f1de9cb48731e4.js',
          revision: '06f1de9cb48731e4',
        },
        {
          url: '/_next/static/chunks/pages/profile-1c9723265ca52f88.js',
          revision: '1c9723265ca52f88',
        },
        {
          url: '/_next/static/chunks/pages/profit-8686a8dcd1834f48.js',
          revision: '8686a8dcd1834f48',
        },
        {
          url: '/_next/static/chunks/pages/real-estate-46a7c9d75b1dd9c5.js',
          revision: '46a7c9d75b1dd9c5',
        },
        {
          url: '/_next/static/chunks/pages/sepdomain-81a824a48ef4963c.js',
          revision: '81a824a48ef4963c',
        },
        {
          url: '/_next/static/chunks/pages/service-828e008df1913314.js',
          revision: '828e008df1913314',
        },
        {
          url: '/_next/static/chunks/pages/streets-5508282061fe37f5.js',
          revision: '5508282061fe37f5',
        },
        {
          url: '/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js',
          revision: '837c0df77fd5009c9e46d446188ecfd0',
        },
        {
          url: '/_next/static/chunks/webpack-a243ad6e89acbb6b.js',
          revision: 'a243ad6e89acbb6b',
        },
        {
          url: '/_next/static/css/157cf3fd2294fbe9.css',
          revision: '157cf3fd2294fbe9',
        },
        {
          url: '/_next/static/css/24ba9cca02159ced.css',
          revision: '24ba9cca02159ced',
        },
        {
          url: '/_next/static/css/2792a8bb116186af.css',
          revision: '2792a8bb116186af',
        },
        {
          url: '/_next/static/css/381a92794f43cb52.css',
          revision: '381a92794f43cb52',
        },
        {
          url: '/_next/static/css/3ccc8111e9652049.css',
          revision: '3ccc8111e9652049',
        },
        {
          url: '/_next/static/css/518c3aad2ef792f3.css',
          revision: '518c3aad2ef792f3',
        },
        {
          url: '/_next/static/css/5651bd6674dbcb5c.css',
          revision: '5651bd6674dbcb5c',
        },
        {
          url: '/_next/static/css/5780d266b812fa69.css',
          revision: '5780d266b812fa69',
        },
        {
          url: '/_next/static/css/6b61cf120cc7f239.css',
          revision: '6b61cf120cc7f239',
        },
        {
          url: '/_next/static/css/88dd3eae997ab66f.css',
          revision: '88dd3eae997ab66f',
        },
        {
          url: '/_next/static/css/c33e6ed2e2b7212e.css',
          revision: 'c33e6ed2e2b7212e',
        },
        {
          url: '/_next/static/css/c89d73995a2d50fd.css',
          revision: 'c89d73995a2d50fd',
        },
        {
          url: '/_next/static/css/cded7f4e6d31be55.css',
          revision: 'cded7f4e6d31be55',
        },
        {
          url: '/_next/static/css/ce6dff0f944e6856.css',
          revision: 'ce6dff0f944e6856',
        },
        {
          url: '/_next/static/css/df66545600d02a23.css',
          revision: 'df66545600d02a23',
        },
        {
          url: '/_next/static/css/dfce387259ce3785.css',
          revision: 'dfce387259ce3785',
        },
        {
          url: '/_next/static/css/e686bd99d53baa3a.css',
          revision: 'e686bd99d53baa3a',
        },
        {
          url: '/_next/static/css/ef46db3751d8e999.css',
          revision: 'ef46db3751d8e999',
        },
        {
          url: '/_next/static/css/ef952a717b2a7546.css',
          revision: 'ef952a717b2a7546',
        },
        {
          url: '/_next/static/css/f144ec04df93fae5.css',
          revision: 'f144ec04df93fae5',
        },
        {
          url: '/_next/static/wfJKseCBoHJnRGowsyU-_/_buildManifest.js',
          revision: 'a437fd742a0d868cb0a7fdff60df9e32',
        },
        {
          url: '/_next/static/wfJKseCBoHJnRGowsyU-_/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/animations/AnimationCity.json',
          revision: 'da772a2b6b401b787f934953c094f7ac',
        },
        {
          url: '/animations/AnimationCity1.json',
          revision: '75b695c1f3ff277e064d83ccddb0d51b',
        },
        {
          url: '/animations/WaveForBG.json',
          revision: 'b63e3f9aae0ac2db69293b755a0367aa',
        },
        { url: '/city.png', revision: '08fb15bdc608ed7391470af20c839aaf' },
        { url: '/favicon.ico', revision: '05d921056ba947554655f1c179a35f72' },
        {
          url: '/icons/icon.png',
          revision: '886ea6745b1b58f12e675fae308e7a4b',
        },
        { url: '/manifest.json', revision: '17b8c2073866ebd4e439fdbc56c49dac' },
        {
          url: '/pngwing.com.svg',
          revision: '055254e7728b02dc4917dd23d7aa9b02',
        },
        { url: '/swagger.json', revision: '8c562e294492a0715665f0011c26b39b' },
        { url: '/vercel.svg', revision: '4b4f1876502eb6721764637fe5c41702' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: c,
              state: a,
            }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-data',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: 'static-data-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1
        const s = e.pathname
        return !s.startsWith('/api/auth/') && !!s.startsWith('/api/')
      },
      new e.NetworkFirst({
        cacheName: 'apis',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1
        return !e.pathname.startsWith('/api/')
      },
      new e.NetworkFirst({
        cacheName: 'others',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: 'cross-origin',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      'GET'
    )
})
