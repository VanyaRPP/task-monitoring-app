export default function numberToTextNumber(number) {
  const k = [
    'одна тисяча',
    'дві тисячі',
    'три тисячі',
    'чотири тисячі',
    "п'ять тисяч",
    'шість тисяч',
    'сім тисяч',
    'вісім тисяч',
    "дев'ять тисяч",
  ]
  const h = [
    'сто',
    'двісті',
    'триста',
    'чотириста',
    "п'ятсот",
    'шістсот',
    'сімсот',
    'вісімсот',
    "дев'ятсот",
  ]
  const t = [
    '',
    'десять',
    'двадцять',
    'тридцять',
    'сорок',
    "п'ятдесят",
    'шістдесят',
    'сімдесят',
    'вісімдесят',
    "дев'яносто",
  ]
  const o = [
    '',
    'одна',
    'дві',
    'три',
    'чотири',
    "п'ять",
    'шість',
    'сім',
    'вісім',
    "дев'ять",
  ]
  const p = [
    'одинадцять',
    'дванадцять',
    'тринадцять',
    'чотирнадцять',
    "п'ятнадцять",
    'шістнадцять',
    'сімнадцять',
    'вісімнадцять',
    "дев'ятнадцять",
  ]

  const str = (number || '').toString()
  let out = ''

  if (str.length === 1) return o[number]
  else if (str.length === 2) {
    if (parseInt(str[0]) === 1) out = p[parseInt(str[1]) - 1]
    else
      out =
        t[parseInt(str[0])] + (str[1] !== '0' ? ' ' + o[parseInt(str[1])] : '')
  } else if (str.length === 3) {
    if (parseInt(str[1]) === 1)
      out =
        h[parseInt(str[0]) - 1] +
        (str[2] !== '0' ? ' ' + p[parseInt(str[2]) - 1] : '')
    else
      out =
        h[parseInt(str[0]) - 1] +
        (str[1] !== '0' ? ' ' + t[parseInt(str[1])] : '') +
        (str[2] !== '0' ? ' ' + o[parseInt(str[2])] : '')
  } else if (str.length === 4) {
    if (parseInt(str[2]) === 1)
      out =
        k[parseInt(str[0]) - 1] +
        (str[1] !== '0' ? ' ' + h[parseInt(str[1]) - 1] : '') +
        (str[2] !== '0' ? ' ' + p[parseInt(str[3]) - 1] : '')
    else
      out =
        k[parseInt(str[0]) - 1] +
        (str[1] !== '0' ? ' ' + h[parseInt(str[1]) - 1] : '') +
        (str[2] !== '0' ? ' ' + t[parseInt(str[2])] : '') +
        (str[3] !== '0' ? ' ' + o[parseInt(str[3])] : '')
  }

  const arr = out.split(' ')
  arr[0] =
    typeof arr?.[0] === 'string'
      ? arr[0].charAt(0).toUpperCase() + arr[0].slice(1)
      : ''
  out = arr.join(' ')

  return out
}
