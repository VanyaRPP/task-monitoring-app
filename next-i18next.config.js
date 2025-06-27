module.exports = {
  i18n: {
    defaultLocale: 'uk',
    locales: ['en', 'uk'],
    // localeDetection: false,
  },
  localePath: './public/locales',
  ns: ['common', 'profitPage', 'profitPayment', 'paymentTable'], // потрібно додати сюди namespace, які будуть використовуватись
  defaultNS: 'common',
}
