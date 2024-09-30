import {inputNumberParser} from "@utils/helpers";


describe('Parsing string to number', () => {

  test('default', () => {
    expect(inputNumberParser('52')).toBe(52);
  })
  test('52.24', () => {
    expect(inputNumberParser('52.24')).toBe(52.24);
  })
  test('52,24', () => {
    expect(inputNumberParser('52,24')).toBe(52.24);
  })
  test('0.24', () => {
    expect(inputNumberParser('0.24')).toBe(0.24);
  })
  test('52,24', () => {
    expect(inputNumberParser('0,24')).toBe(0.24);
  })

  test('1 000 000', () => {
    expect(inputNumberParser('1 000 000')).toBe(1000000);
  });
  test('1 000000', () => {
    expect(inputNumberParser('1 000000')).toBe(1000000);
  });
  test('1 0005.24', () => {
    expect(inputNumberParser('1 0005.24')).toBe(10005.24);
  });
  test('1 0005,24', () => {
    expect(inputNumberParser('1 0005,24')).toBe(10005.24);
  });

  test('1   000   000', () => {
    expect(inputNumberParser('1   000   000')).toBe(1000000);
  });
  test('1  000000', () => {
    expect(inputNumberParser('1  000000')).toBe(1000000);
  });
  test('1    0005   .24', () => {
    expect(inputNumberParser('1    0005   .24')).toBe(10005.24);
  });
  test('1   0005,  24', () => {
    expect(inputNumberParser('1   0005,  24')).toBe(10005.24);
  });


  test('1,000,000', () => {
    expect(inputNumberParser('1,000,000')).toBe(1000000);
  });
  test('1,000000', () => {
    expect(inputNumberParser('1,000000')).toBe(1000000);
  });
  test('1000,000', () => {
    expect(inputNumberParser('1000,000')).toBe(1000000);
  });
  test('1,000.52', () => {
    expect(inputNumberParser('1,000.52')).toBe(1000.52);
  });
  test('1,000,52', () => {
    expect(inputNumberParser('1,000,52')).toBe(1000.52);
  });
  test('1000.524', () => {
    expect(inputNumberParser('1000.524')).toBe(1000.524);
  });
  test('1000,524', () => {
    expect(inputNumberParser('1000,524')).toBe(1000524);
  });

  test('1,,000,,000', () => {
    expect(inputNumberParser('1,,000,,000')).toBe(1000000);
  });
  test('1,,,000,,,000', () => {
    expect(inputNumberParser('1,,,000,,,000')).toBe(1000000);
  });
  test('1,000,000', () => {
    expect(inputNumberParser('1,000,000')).toBe(1000000);
  });
  test('1,000,,000', () => {
    expect(inputNumberParser('1,000,,000')).toBe(1000000);
  });


  test('Возвращает null для строки, которая не является числом', () => {
    expect(inputNumberParser('abc')).toBeNull();
  });

  test('Возвращает null для пустой строки', () => {
    expect(inputNumberParser('')).toBeNull();
  });

  test('Корректно обрабатывает строку без разделителей тысяч и десятичных', () => {
    expect(inputNumberParser('1000')).toBe(1000);
  });


  test('Возвращает null для undefined', () => {
    expect(inputNumberParser(undefined)).toBeNull();
  });

});