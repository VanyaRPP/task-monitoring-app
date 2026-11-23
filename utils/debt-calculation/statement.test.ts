import {
  checkStatement,
  columnRoles,
  detectCorrectionSign,
  mergeStatementRows,
  parseAmount,
  parsePeriodCell,
  parseStatementCells,
  toStatementImport,
} from './statement'

// Columns as the vision model read them off a real HOA printout
// (Покровська 149), garbling included.
const COLUMNS = [
  'Мі/Рк',
  'Вхідне сальдо',
  'Коректура',
  'Нараху-вання',
  'Ел. банк',
  'Оплата',
  'Субсидія',
  'Вихідне сальдо',
]

// кв. 72, 2019-2020: the 6,86 correction LOWERS the debt, payments come
// through "Ел. банк".
const KV72 = [
  '9/2019|16192,23|0,00|424,46||||16616,69',
  '10/2019|16616,69|0,00|424,46|400,00|||16641,15',
  '11/2019|16641,15|6,86|424,46||||17058,75',
  '12/2019|17058,75|0,00|424,46||||17483,21',
  '1/2020|17483,21|0,00|472,39|400,00|||17555,60',
]

describe('parseAmount', () => {
  it.each([
    ['4217,35', 4217.35],
    ['4 217,35', 4217.35],
    ['4 217,35', 4217.35],
    ['-150,00', -150],
    ['−150,00', -150],
    ['(150,00)', -150],
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['0', 0],
  ])('%s → %d', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected)
  })

  it('порожня клітинка — null, не число — окрема позначка', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount(null)).toBeNull()
    expect(typeof parseAmount('4217,3S')).toBe('symbol')
  })
})

describe('parsePeriodCell', () => {
  it.each([
    ['8/2018', { year: 2018, month: 8 }],
    ['08.2018', { year: 2018, month: 8 }],
    ['8/18', { year: 2018, month: 8 }],
    ['2018-08', { year: 2018, month: 8 }],
    ['Серпень 2018', { year: 2018, month: 8 }],
    ['лист. 2021', { year: 2021, month: 11 }],
  ])('%s', (raw, expected) => {
    expect(parsePeriodCell(raw)).toEqual(expected)
  })

  it.each(['13/2018', 'Разом', ''])('не місяць: %s', (raw) => {
    expect(parsePeriodCell(raw)).toBeNull()
  })
})

describe('columnRoles', () => {
  it('впізнає колонки за основою слова, навіть покалічені фото', () => {
    expect(columnRoles(COLUMNS)).toEqual([
      'period',
      'opening',
      'correction',
      'charged',
      'payment',
      'payment',
      'payment',
      'closing',
    ])
  })

  it('незнайома перша колонка — це місяць', () => {
    expect(columnRoles(['??', 'Вхідне', 'Нарах.', 'Вихідне'])[0]).toBe('period')
  })
})

describe('parseStatementCells', () => {
  it('сумує всі колонки оплат в одну', () => {
    const { rows, issues } = parseStatementCells(COLUMNS, [
      '9/2023|27757,03|0,00|560,52|500,00|331,03|0|27486,52',
    ])

    expect(issues).toEqual([])
    expect(rows).toEqual([
      {
        year: 2023,
        month: 9,
        opening: 27757.03,
        correction: 0,
        charged: 560.52,
        paid: 831.03,
        closing: 27486.52,
      },
    ])
  })

  it('заголовок, прочитаний як рядок, мовчки пропускає; кривий рядок — з попередженням', () => {
    const { rows, issues } = parseStatementCells(COLUMNS, [
      'М/Рік|Вхідне сальдо|Коректура|Нарахування|Ел. банк|Оплата|Субсидія|Вихідне сальдо',
      '9/2019|16192,23|0,00|424,46',
      '10/2019|16616,69|0,00|424,4б|400,00|||16641,15',
      KV72[0],
    ])

    expect(rows).toHaveLength(1)
    expect(issues.map(({ kind }) => kind)).toEqual(['unreadable', 'unreadable'])
  })

  it('рядок з зайвою чи бракуючою порожньою клітинкою читає за змістом', () => {
    // Real reads of кв. 72 that the strict cell count used to drop.
    const { rows, issues } = parseStatementCells(COLUMNS, [
      '8/2021|22175,55|37,68|450,68||||0|22588,55',
      '9/2024|16825,17|0,00|659,71|700,00|2823,81||0|13961,07',
      '12/2024|12372,19|165,43|659,71|500,00||||12366,47',
      '4/2025|11024,41|0,00|0,00||||||11024,41',
    ])

    expect(issues).toEqual([])
    expect(
      rows.map(({ correction, charged, paid, closing }) => [
        correction,
        charged,
        paid,
        closing,
      ])
    ).toEqual([
      [37.68, 450.68, 0, 22588.55],
      [0, 659.71, 3523.81, 13961.07],
      [165.43, 659.71, 500, 12366.47],
      [0, 0, null, 11024.41],
    ])
  })

  it('відповідь «по клітинці» (реальна, кв. 71) збирає назад у рядки', () => {
    const { rows, issues } = parseStatementCells(COLUMNS, [
      '8/2018',
      '622,86',
      '0,00',
      '285,27',
      '0',
      '908,13',
      '9/2018',
      '908,13',
      '0,00',
      '285,27',
      '218,00',
      '0',
      '975,40',
    ])

    expect(issues).toEqual([])
    expect(rows).toEqual([
      {
        year: 2018,
        month: 8,
        opening: 622.86,
        correction: 0,
        charged: 285.27,
        paid: 0,
        closing: 908.13,
      },
      {
        year: 2018,
        month: 9,
        opening: 908.13,
        correction: 0,
        charged: 285.27,
        paid: 218,
        closing: 975.4,
      },
    ])
  })

  it.each([
    [
      'кілька рядків в одному елементі',
      [
        '9/2019|16192,23|0,00|424,46||||16616,69\n10/2019|16616,69|0,00|424,46|400,00|||16641,15',
      ],
    ],
    [
      'через пробіли',
      [
        '9/2019 16192,23 0,00 424,46 16616,69',
        '10/2019 16616,69 0,00 424,46 400,00 16641,15',
      ],
    ],
    [
      'через крапку з комою й місяць словами',
      [
        'Вересень 2019;16192,23;0,00;424,46;;;;16616,69',
        'Жовтень 2019;16616,69;0,00;424,46;400,00;;;16641,15',
      ],
    ],
  ])('інший формат рядків — %s', (_, lines) => {
    const { rows, issues } = parseStatementCells(COLUMNS, lines)

    expect(issues).toEqual([])
    expect(
      rows.map(({ month, paid, closing }) => [month, paid, closing])
    ).toEqual([
      [9, null, 16616.69],
      [10, 400, 16641.15],
    ])
  })

  it('без ключових колонок нічого не вгадує', () => {
    const { rows, issues } = parseStatementCells(
      ['Місяць', 'Сума'],
      ['8/2018|100']
    )

    expect(rows).toEqual([])
    expect(issues[0].kind).toBe('columns')
  })
})

describe('checkStatement', () => {
  it('знак коректури визначає сама виписка: тут вона зменшує борг', () => {
    const { rows } = parseStatementCells(COLUMNS, KV72)
    const checked = checkStatement(rows)

    expect(checked.correctionSign).toBe(-1)
    expect(checked.issues).toEqual([])
  })

  it('якщо коректура на аркуші збільшує борг — теж підхоплює', () => {
    const { rows } = parseStatementCells(COLUMNS, [
      '11/2019|16641,15|6,86|424,46||||17072,47',
    ])

    expect(detectCorrectionSign(rows)).toBe(1)
  })

  it("оплату, що «з'їхала» на сусідній рядок, бере з сальдо і позначає", () => {
    // кв. 71 as read off the skewed photo: the 218,00 of 9/2018 landed on 8/2018.
    const { rows } = parseStatementCells(COLUMNS, [
      '8/2018|622,86|0,00|285,27|218,00|||908,13',
      '9/2018|908,13|0,00|285,27||||975,40',
      '10/2018|975,40|0,00|285,27||||1260,67',
    ])

    const checked = checkStatement(rows)

    expect(checked.rows.map(({ paid }) => paid)).toEqual([0, 218, null])
    expect(checked.issues.map(({ kind, period }) => [kind, period])).toEqual([
      ['autocorrected', '2018-08'],
      ['autocorrected', '2018-09'],
    ])
  })

  it('нарахування, прочитане з сусіднього рядка на межі тарифу, виправляє саме нарахування', () => {
    // кв. 71, real read: 1/2019 got February's new tariff 295,71 instead of
    // 285,27. Fixing the payment instead would invent a 10,44 payment.
    const { rows } = parseStatementCells(COLUMNS, [
      '12/2018|1545,94|0,00|285,27||||1831,21',
      '1/2019|1831,21|0,00|295,71||||2116,48',
      '2/2019|2116,48|0,00|295,71||||2412,19',
    ])

    const { issues, rows: checked } = checkStatement(rows)

    expect(checked[1]).toMatchObject({ charged: 285.27, paid: null })
    expect(issues.map(({ kind, period }) => [kind, period])).toEqual([
      ['autocorrected', '2019-01'],
    ])
  })

  it('колонка вихідного сальдо, що зʼїхала на рядок, не заважає: рядки звіряються з вхідним наступного', () => {
    // кв. 71 as read off a real skewed photo: for 12/2019-3/2020 every closing
    // is the NEXT month's. Openings, charges and payments are right.
    const { rows } = parseStatementCells(COLUMNS, [
      '11/2019|4777,87|5,18|295,71||||5068,40',
      '12/2019|5068,40|0,00|295,71||||5695,98',
      '1/2020|5364,11|0,00|331,87||||6027,85',
      '2/2020|5695,98|0,00|331,87||||6387,35',
      '3/2020|6027,85|0,00|359,50||||6387,35',
    ])

    const { issues, rows: checked } = checkStatement(rows)

    expect(issues).toEqual([])
    expect(checked).toEqual(rows)
  })

  it('неправильно прочитане вхідне сальдо — попередження, без «ремонту» оплати', () => {
    const { rows } = parseStatementCells(COLUMNS, [
      KV72[0],
      // opening misread: 16616,69 → 16616,99; closing and next opening agree.
      '10/2019|16616,99|0,00|424,46|400,00|||16641,15',
      KV72[2],
    ])

    const { issues, rows: checked } = checkStatement(rows)

    expect(checked[1].paid).toBe(400)
    expect(issues.map(({ kind, period }) => [kind, period])).toEqual([
      ['arithmetic', '2019-10'],
    ])
  })

  it('праві колонки, що зʼїхали на рядок на цілому відрізку, вирівнює', () => {
    // Real Gemini read of a tilted test sheet: from 10/2019 on, every row
    // carries the NEXT month's payments and closing.
    const { rows } = parseStatementCells(COLUMNS, [
      '9/2019|8672,95|0,00|441,08||||9114,03',
      '10/2019|9114,03|0,00|441,08||2228,73||7067,46',
      '11/2019|8855,11|0,00|441,08|700,00|||6808,54',
      '12/2019|7067,46|0,00|441,08|500,00|||6749,62',
      '1/2020|6808,54|0,00|441,08||||7223,34',
      '2/2020|6749,62|0,00|473,72|200,00|||7497,06',
    ])

    const { rows: checked, issues } = checkStatement(rows)

    // Truth: 10/2019 paid 700, 11/2019 paid 2228,73, 12/2019 paid 700,
    // 1/2020 paid 500, 2/2020 nothing (a blank cell).
    expect(checked.map(({ paid }) => paid)).toEqual([
      null,
      700,
      2228.73,
      700,
      500,
      null,
    ])
    expect(issues.every(({ kind }) => kind === 'autocorrected')).toBe(true)
  })

  it('стрибок сальдо на самому папері (кв. 71, 11/2022) стає коректурою', () => {
    const { rows } = parseStatementCells(COLUMNS, [
      '10/2022|16668,03|0,00|373,71||||17041,74',
      '11/2022|16593,02|0,00|373,71||||16966,73',
      '12/2022|16966,73|0,00|373,71||||17340,44',
    ])

    const checked = checkStatement(rows)
    const imported = toStatementImport(checked.rows, checked.correctionSign)

    expect(checked.issues.map(({ kind, period }) => [kind, period])).toEqual([
      ['autocorrected', '2022-11'],
    ])
    // Replaying from the first opening lands on the paper's last closing.
    const replayed = imported.months.reduce(
      (debt, m) => debt + m.charged + m.correction - m.paid,
      imported.openingBalance.amount
    )
    expect(replayed).toBeCloseTo(17340.44, 2)
  })

  it('рядок «Всього» під таблицею мовчки пропускає', () => {
    const { rows, issues } = parseStatementCells(COLUMNS, [
      '5/2026|10824,41|0,00|0,00||||10824,41',
      'Всього:|248,85|40036,46|19320,00|19445,21|0',
    ])

    expect(rows).toHaveLength(1)
    expect(issues).toEqual([])
  })

  it('рядок, що віддав свою праву частину сусіду, не лишає собі чужої оплати (кв. 72, 4-5/2025)', () => {
    // Real read: April carries May's 200 payment and closing; May lost them.
    const { rows } = parseStatementCells(COLUMNS, [
      '3/2025|11724,41|0,00|0,00|700,00|||11024,41',
      '4/2025|11024,41|0,00|0,00|200,00|||10824,41',
      '5/2025|11024,41|0,00|0,00|||0|',
      '6/2025|10824,41|0,00|0,00||||10824,41',
    ])

    const { rows: checked, issues } = checkStatement(rows)

    expect(
      checked.map(({ month, paid, correction }) => [
        month,
        paid ?? 0,
        correction,
      ])
    ).toEqual([
      [3, 700, 0],
      [4, 0, 0],
      [5, 200, 0],
      [6, 0, 0],
    ])
    // No invented correction for a jump that was only a misread.
    expect(issues.some(({ message }) => message.includes('коректуру'))).toBe(
      false
    )
  })

  it('позначає пропущені місяці', () => {
    const { rows } = parseStatementCells(COLUMNS, [KV72[0], KV72[2]])

    expect(checkStatement(rows).issues.map(({ kind }) => kind)).toContain('gap')
  })
})

describe('mergeStatementRows', () => {
  it('зшиває смуги й сторінки, з двох копій місяця бере ту, що сходиться', () => {
    const top = parseStatementCells(COLUMNS, [KV72[0], KV72[1]]).rows
    const bottom = parseStatementCells(COLUMNS, [
      // The same month cut by the strip's edge - misread.
      '10/2019|16616,69|0,00|424,46||||16641,15',
      KV72[2],
      KV72[3],
    ]).rows

    const merged = mergeStatementRows([bottom, top])

    expect(merged.map(({ month }) => month)).toEqual([9, 10, 11, 12])
    expect(merged[1].paid).toBe(400)
  })
})

describe('mergeStatementRows: копії, що обидві сходяться', () => {
  it('бере ту, що зшивається з сусідніми місяцями', () => {
    const { rows } = parseStatementCells(COLUMNS, [
      '3/2025|11724,41|0,00|0,00|700,00|||0|11024,41',
      // Payment missed AND closing misread - adds up on its own.
      '4/2025|11024,41|0,00|0,00||||||11024,41',
      '4/2025|11024,41|0,00|0,00|200,00|||0|10824,41',
      '5/2025|10824,41|0,00|0,00||||0|10824,41',
    ])

    const april = mergeStatementRows([rows]).find(({ month }) => month === 4)

    expect(april).toMatchObject({ paid: 200, closing: 10824.41 })
  })
})

describe('toStatementImport', () => {
  it('вхідне сальдо першого місяця — окремо, коректура — зі знаком для боргу', () => {
    const { rows } = parseStatementCells(COLUMNS, KV72)
    const { rows: checked, correctionSign } = checkStatement(rows)

    const imported = toStatementImport(checked, correctionSign)

    expect(imported.openingBalance).toEqual({
      year: 2019,
      month: 9,
      amount: 16192.23,
    })
    expect(imported.months[2]).toEqual({
      year: 2019,
      month: 11,
      charged: 424.46,
      correction: -6.86,
      paid: 0,
    })

    // Replaying the months from the opening balance lands on every printed
    // closing balance - the payments will add up to the paper.
    let debt = imported.openingBalance.amount
    imported.months.forEach((month, index) => {
      debt =
        Math.round(
          (debt + month.charged + month.correction - month.paid) * 100
        ) / 100
      expect(debt).toBe(checked[index].closing)
    })
  })
})
