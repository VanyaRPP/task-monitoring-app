const units: string[] = ["", "одина", "дві", "три", "чотири", "п'ять", "шість", "сім", "вісім", "дев'ять"];
const teens: string[] = ["", "одинадцять", "дванадцять", "тринадцять", "чотирнадцять", "п'ятнадцять", "шістнадцять", "сімнадцять", "вісімнадцять", "дев'ятнадцять"];
const tens: string[] = ["", "десять", "двадцять", "тридцять", "сорок", "п'ятдесят", "шістдесят", "сімдесят", "вісімдесят", "дев'яносто"];
const hundreds: string[] = ["", "сто", "двісті", "триста", "чотириста", "п'ятсот", "шістсот", "сімсот", "вісімсот", "дев'ятсот"];

const getThousandsWord = (n: number): string => {
  if (n % 10 === 1 && n % 100 !== 11) return "тисяча";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "тисячі";
  return "тисяч";
}

const getMillionsWord = (n: number): string => {
  if (n % 10 === 1 && n % 100 !== 11) return "мільйон";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "мільйони";
  return "мільйонів";
}

const convertToWords = (n: number): string => {
  if (n < 10) return units[n];
  if (n > 10 && n < 20) return teens[n - 10];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 === 0 ? "" : " " + units[n % 10]);
  if (n < 1000) {
    const remainder = n % 100;
    if (remainder === 0) return hundreds[Math.floor(n / 100)];
    if (remainder < 10) return hundreds[Math.floor(n / 100)] + " " + units[remainder];
    if (remainder > 10 && remainder < 20) return hundreds[Math.floor(n / 100)] + " " + teens[remainder - 10];
    return hundreds[Math.floor(n / 100)] + " " + tens[Math.floor(remainder / 10)] + (remainder % 10 === 0 ? "" : " " + units[remainder % 10]);
  }
  return "";
}

export default (num: number): string => {
  if (num === 0) return "нуль";

  let result = "";
  const millionPart = Math.floor(num / 1000000);
  const thousandPart = Math.floor((num % 1000000) / 1000);
  const remainderPart = num % 1000;

  if (millionPart > 0) {
    result += convertToWords(millionPart) + " " + getMillionsWord(millionPart) + " ";
  }

  if (thousandPart > 0) {
    result += convertToWords(thousandPart) + " " + getThousandsWord(thousandPart) + " ";
  }

  if (remainderPart > 0 || num === 0) {
    result += convertToWords(remainderPart);
  }

  return result.trim();
}