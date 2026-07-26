/**
 * Сравнение данных проекта для определения, изменились ли они
 * Сравнивает содержимое объектов, а не ссылки
 */

/**
 * Сравнить массивы дополнительных полей
 * @param {Array} fields1 - Первый массив полей
 * @param {Array} fields2 - Второй массив полей
 * @returns {boolean} - true если поля одинаковые, false если разные
 */
const areCustomFieldsEqual = (fields1, fields2) => {
  if (!fields1 && !fields2) return true;
  if (!fields1 || !fields2) return false;
  if (fields1.length !== fields2.length) return false;

  for (let i = 0; i < fields1.length; i++) {
    const f1 = fields1[i];
    const f2 = fields2.find((f) => f.id === f1.id);
    if (!f2) return false;
    if (f1.name !== f2.name) return false;
    if (f1.type !== f2.type) return false;

    // Для файловых полей сравниваем объект файла
    if (f1.type === "file") {
      if (!f1.value && !f2.value) continue;
      if (!f1.value || !f2.value) return false;
      if (f1.value.url !== f2.value.url) return false;
      if (f1.value.name !== f2.value.name) return false;
    } else {
      if (f1.value !== f2.value) return false;
    }
  }

  return true;
};

/**
 * Сравнить данные проекта
 * @param {Object} data1 - Первый набор данных проекта
 * @param {Object} data2 - Второй набор данных проекта
 * @returns {boolean} - true если данные одинаковые, false если разные
 */
export const areProjectDataEqual = (data1, data2) => {
  // Сравниваем product
  if (data1.product?.id !== data2.product?.id) return false;
  if (data1.product?.name !== data2.product?.name) return false;
  if (data1.product?.comment !== data2.product?.comment) return false;
  if (data1.product?.image !== data2.product?.image) return false;
  if (data1.product?.image_url !== data2.product?.image_url) return false;
  if (data1.product?.position?.x !== data2.product?.position?.x) return false;
  if (data1.product?.position?.y !== data2.product?.position?.y) return false;
  // Сравниваем дополнительные поля товара
  if (
    !areCustomFieldsEqual(
      data1.product?.customFields,
      data2.product?.customFields
    )
  )
    return false;

  // Сравниваем parameters
  if (data1.parameters?.length !== data2.parameters?.length) return false;
  if (data1.parameters) {
    for (let i = 0; i < data1.parameters.length; i++) {
      const p1 = data1.parameters[i];
      const p2 = data2.parameters.find((p) => p.id === p1.id);
      if (!p2) return false;
      if (p1.type !== p2.type) return false;
      if (p1.position?.x !== p2.position?.x) return false;
      if (p1.position?.y !== p2.position?.y) return false;

      // Для кастомных типов сравниваем название типа
      if (p1.type === "custom") {
        if (p1.customTypeName !== p2.customTypeName) return false;
      } else {
        // Для обычных типов сравниваем value и comment
        if (p1.value !== p2.value) return false;
        if (p1.comment !== p2.comment) return false;
        // Для мастера сравниваем дополнительные поля
        if (p1.type === "master") {
          if (p1.hours !== p2.hours) return false;
          if (p1.payment !== p2.payment) return false;
        }
      }

      // Сравниваем дополнительные поля параметра
      if (!areCustomFieldsEqual(p1.customFields, p2.customFields)) return false;
    }
  }

  // Сравниваем connections
  if (data1.connections?.length !== data2.connections?.length) return false;
  if (data1.connections) {
    const conn1Ids = data1.connections
      .map((c) => `${c.from}-${c.to}`)
      .sort()
      .join(",");
    const conn2Ids = data2.connections
      .map((c) => `${c.from}-${c.to}`)
      .sort()
      .join(",");
    if (conn1Ids !== conn2Ids) return false;
  }

  // Сравниваем files
  if (data1.product?.files?.length !== data2.product?.files?.length)
    return false;
  if (data1.product?.files) {
    const files1Ids = data1.product.files
      .map((f) => f.id)
      .sort()
      .join(",");
    const files2Ids = data2.product.files
      .map((f) => f.id)
      .sort()
      .join(",");
    if (files1Ids !== files2Ids) return false;
    // Сравниваем основные поля каждого файла
    for (let i = 0; i < data1.product.files.length; i++) {
      const f1 = data1.product.files[i];
      const f2 = data2.product.files.find((f) => f.id === f1.id);
      if (!f2) return false;
      if (f1.name !== f2.name) return false;
      if (f1.url !== f2.url) return false;
    }
  }

  return true;
};
