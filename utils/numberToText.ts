export function numberToTextNumber(number) {
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
    ],
    h = [
      'сто',
      'двісті',
      'триста',
      'чотириста',
      "п'ятсот",
      'шість сотень',
      'сімсот',
      'вісімсот',
      "дев'ятсот",
    ],
    t = [
      '',
      'двадцять',
      'тридцять',
      'сорок',
      "п'ятдесят",
      'шістдесят',
      'сімдесят',
      'вісімдесят',
      "дев'яносто",
    ],
    o = [
      'один',
      'два',
      'три',
      'чотири',
      "п'ять",
      'шість',
      'сім',
      'вісім',
      "дев'ять",
    ],
    p = [
      'одиннадцять',
      'дванадцять',
      'тринадцять',
      'чотирнадцять',
      "п'ятнадцять",
      'шістнадцять',
      'сімнадцять',
      'вісімнадцять',
      "де'ятнадцять",
    ]

  const str = number.toString()
  let out = ''
  if (str.length == 1) return o[number - 1]
  else if (str.length == 2) {
    if (str[0] == 1) out = p[parseInt(str[1]) - 1]
    else
      out =
        t[parseInt(str[0]) - 1] +
        (str[1] != '0' ? ' ' + o[parseInt(str[1]) - 1] : '')
  } else if (str.length == 3) {
    if (str[1] == 1)
      out =
        h[parseInt(str[0]) - 1] +
        (str[1] != '0' ? ' ' + p[parseInt(str[2]) - 1] : '')
    else
      out =
        h[parseInt(str[0]) - 1] +
        (str[1] != '0' ? ' ' + t[parseInt(str[1]) - 1] : '') +
        (str[2] != '0' ? ' ' + o[parseInt(str[2]) - 1] : '')
  } else if (str.length == 4) {
    if (str[2] == 1)
      out =
        k[parseInt(str[0]) - 1] +
        (str[1] != '0' ? ' ' + h[parseInt(str[1]) - 1] : '') +
        (str[2] != '0' ? ' ' + p[parseInt(str[3]) - 1] : '')
    else
      out =
        k[parseInt(str[0]) - 1] +
        (str[1] != '0' ? ' ' + h[parseInt(str[1]) - 1] : '') +
        (str[2] != '0' ? ' ' + t[parseInt(str[2]) - 1] : '') +
        (str[3] != '0' ? ' ' + o[parseInt(str[3]) - 1] : '')
  }

  const arr = out.split('')
  arr[0] = typeof arr?.[0] === 'string' ? arr[0].toUpperCase() : ''
  out = arr.join('')
  return out
}