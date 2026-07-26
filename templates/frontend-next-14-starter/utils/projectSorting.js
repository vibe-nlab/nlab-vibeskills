/**
 * Порядок статусов для сортировки (приоритет)
 */
const STATUS_ORDER = {
  new: 1,
  in_progress: 2,
  under_review: 3,
  needs_attention: 4,
  on_hold: 5,
  completed: 6,
  cancelled: 7,
};

/**
 * Сортирует список проектов
 * @param {Array} projects - Список проектов
 * @param {Object} projectsData - Данные проектов (deadline, client и т.д.), ключи - id проектов
 * @param {string} sortBy - Критерий сортировки ('deadline', 'created', 'name', 'status')
 * @param {string} sortOrder - Порядок сортировки ('asc', 'desc')
 * @returns {Array} Отсортированный список проектов
 */
export const getSortedProjects = (
  projects,
  projectsData,
  sortBy,
  sortOrder
) => {
  if (!projects || !Array.isArray(projects)) return [];

  const sorted = [...projects].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "deadline":
        // Сортируем по дате сдачи (endDate из deadline)
        const aDeadline = projectsData[a.id]?.deadline;
        const bDeadline = projectsData[b.id]?.deadline;

        if (!aDeadline && !bDeadline) return 0;
        if (!aDeadline) return 1; // Проекты без deadline в конец
        if (!bDeadline) return -1;

        // Извлекаем endDate
        // deadline может быть объектом { startDate, endDate } или строкой
        let aEndDate = null;
        if (typeof aDeadline === "object" && aDeadline !== null) {
          aEndDate = aDeadline.endDate || aDeadline.startDate || null;
        } else {
          aEndDate = aDeadline;
        }

        let bEndDate = null;
        if (typeof bDeadline === "object" && bDeadline !== null) {
          bEndDate = bDeadline.endDate || bDeadline.startDate || null;
        } else {
          bEndDate = bDeadline;
        }

        // Если строка, пробуем парсить (хотя обычно здесь уже объект или null)
        // Но для надежности проверяем
        if (typeof aEndDate === "string") {
          // Логика парсинга если нужно, но предполагаем что там валидная дата или строка даты
        }

        if (!aEndDate && !bEndDate) return 0;
        if (!aEndDate) return 1;
        if (!bEndDate) return -1;

        aValue = new Date(aEndDate).getTime();
        bValue = new Date(bEndDate).getTime();

        // Обработка невалидных дат
        if (isNaN(aValue)) aValue = Number.MAX_SAFE_INTEGER;
        if (isNaN(bValue)) bValue = Number.MAX_SAFE_INTEGER;

        break;

      case "created":
        // Сортируем по дате создания
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;

      case "name":
        // Сортируем по названию
        aValue = (a.name || "").toLowerCase();
        bValue = (b.name || "").toLowerCase();
        break;

      case "status":
        // Сортируем по статусу
        const aStatus = a.status || "new";
        const bStatus = b.status || "new";
        aValue = STATUS_ORDER[aStatus] || 999; // Неизвестные статусы в конец
        bValue = STATUS_ORDER[bStatus] || 999;
        break;

      default:
        return 0;
    }

    if (sortBy === "name") {
      // Для строк
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    } else {
      // Для чисел/дат
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    }
  });

  return sorted;
};
