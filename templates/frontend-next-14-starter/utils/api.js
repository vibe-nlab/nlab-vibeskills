/**
 * Утилита для API запросов с автоматическим добавлением Authorization header
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  "http://192.168.0.129:3001/api";

/**
 * Получить access token из localStorage
 */
const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
};

/**
 * Создать headers с Authorization token
 */
const getAuthHeaders = (customHeaders = {}) => {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("No access token found in localStorage");
  }

  return headers;
};

/**
 * Выполнить fetch запрос с автоматическим добавлением токена
 */
const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  // Получаем токен
  const token = getAccessToken();

  // Базовые заголовки
  const headers = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // Обход страницы предупреждения ngrok
    ...(options.headers || {}),
  };

  // ВСЕГДА добавляем Authorization токен, если он есть
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn(
      "⚠️ No access token found in localStorage for request to:",
      endpoint
    );
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Проверяем, что ответ не является HTML страницей (например, страница предупреждения ngrok)
  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.includes("application/json")) {
    // Клонируем response для чтения без потери оригинала
    const clonedResponse = response.clone();
    const text = await clonedResponse.text();
    if (
      text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<!doctype")
    ) {
      throw new Error(
        `Received HTML instead of JSON. This might be ngrok warning page. URL: ${url}. Make sure NEXT_PUBLIC_API_URL is set correctly.`
      );
    }
  }

  return response;
};

/**
 * GET запрос
 */
export const apiGet = async (endpoint, options = {}) => {
  return apiFetch(endpoint, {
    ...options,
    method: "GET",
  });
};

/**
 * POST запрос
 */
export const apiPost = async (endpoint, data, options = {}) => {
  return apiFetch(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * PUT запрос
 */
export const apiPut = async (endpoint, data, options = {}) => {
  return apiFetch(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * DELETE запрос
 */
export const apiDelete = async (endpoint, options = {}) => {
  return apiFetch(endpoint, {
    ...options,
    method: "DELETE",
  });
};

export { API_BASE_URL, getAccessToken, getAuthHeaders };
