import { useState, useEffect } from "react";

// Хук для безопасной работы с localStorage
function useLocalStorage(key, initialValue) {
  // Состояние для хранения значения
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isClient, setIsClient] = useState(false);

  // Устанавливаем флаг клиента после монтирования
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Загружаем значение из localStorage только на клиенте
  useEffect(() => {
    if (!isClient) return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, isClient]);

  // Функция для установки значения
  const setValue = (value) => {
    try {
      // Позволяем value быть функцией, как в useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      // Сохраняем в localStorage только на клиенте
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, isClient];
}

export default useLocalStorage;
