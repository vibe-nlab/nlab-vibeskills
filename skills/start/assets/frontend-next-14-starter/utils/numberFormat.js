/**
 * Форматирование чисел с разделителями тысяч
 * @param {number|string} value - число для форматирования
 * @param {object} options - опции форматирования
 * @param {number} options.decimals - количество знаков после запятой (по умолчанию 0)
 * @param {string} options.decimalSeparator - разделитель дробной части (по умолчанию ',')
 * @param {string} options.thousandsSeparator - разделитель тысяч (по умолчанию ' ')
 * @returns {string} - отформатированное число
 */
export const formatNumber = (value, options = {}) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const {
    decimals = 0,
    decimalSeparator = ",",
    thousandsSeparator = " ",
  } = options;

  // Преобразуем в число
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return String(value);
  }

  // Форматируем с нужным количеством знаков после запятой
  const fixed = num.toFixed(decimals);
  const parts = fixed.split(".");

  // Форматируем целую часть с разделителями тысяч
  const integerPart = parts[0].replace(
    /\B(?=(\d{3})+(?!\d))/g,
    thousandsSeparator
  );

  // Если есть дробная часть и она не нулевая
  if (parts[1] && parseInt(parts[1]) !== 0) {
    return `${integerPart}${decimalSeparator}${parts[1]}`;
  }

  return integerPart;
};

/**
 * Парсинг отформатированного числа обратно в число
 * @param {string} formattedValue - отформатированная строка
 * @returns {number} - число
 */
export const parseFormattedNumber = (formattedValue) => {
  if (!formattedValue || typeof formattedValue !== "string") {
    return null;
  }

  // Удаляем все пробелы (разделители тысяч) и заменяем запятую на точку
  const cleaned = formattedValue.replace(/\s/g, "").replace(/,/g, ".");
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? null : parsed;
};

/**
 * Форматирование денежной суммы
 * @param {number|string} value - сумма
 * @param {string} currency - валюта (по умолчанию '₽')
 * @returns {string} - отформатированная сумма
 */
export const formatCurrency = (value, currency = "₽") => {
  const formatted = formatNumber(value, { decimals: 2, decimalSeparator: "," });
  return formatted ? `${formatted} ${currency}` : `0 ${currency}`;
};

/**
 * Форматирование часов
 * @param {number|string} value - количество часов
 * @returns {string} - отформатированные часы
 */
export const formatHours = (value) => {
  const formatted = formatNumber(value, { decimals: 1, decimalSeparator: "," });
  return formatted ? `${formatted} ч.` : "0 ч.";
};
