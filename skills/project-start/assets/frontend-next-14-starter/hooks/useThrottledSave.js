import { useRef, useCallback } from "react";

/**
 * Хук для троттлинга сохранения данных
 * @param {Function} saveFunction - функция для сохранения данных
 * @param {number} delay - задержка в миллисекундах (по умолчанию 3000)
 * @returns {Function} - функция для вызова сохранения с троттлингом
 */
const useThrottledSave = (saveFunction, delay = 3000) => {
  const timeoutRef = useRef(null);
  const lastSaveDataRef = useRef(null);

  const throttledSave = useCallback(
    (data) => {
      // Сохраняем последние данные
      lastSaveDataRef.current = data;

      // Очищаем предыдущий таймер
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Устанавливаем новый таймер
      timeoutRef.current = setTimeout(() => {
        // Сохраняем последние данные
        if (lastSaveDataRef.current) {
          saveFunction(lastSaveDataRef.current);
          lastSaveDataRef.current = null;
        }
        timeoutRef.current = null;
      }, delay);
    },
    [saveFunction, delay]
  );

  // Функция для принудительного сохранения (если нужно сохранить немедленно)
  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (lastSaveDataRef.current) {
      saveFunction(lastSaveDataRef.current);
      lastSaveDataRef.current = null;
    }
  }, [saveFunction]);

  // Очистка при размонтировании
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { throttledSave, forceSave, cleanup };
};

export default useThrottledSave;
