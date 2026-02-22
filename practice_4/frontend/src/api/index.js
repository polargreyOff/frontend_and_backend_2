import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
  timeout: 10000,
});

function toApiError(err) {
  // Если это не axios-ошибка
  if (!axios.isAxiosError(err)) {
    return new Error("Неизвестная ошибка");
  }

  // Сервер ответил с кодом 4xx/5xx
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data;

    // Если backend отдаёт { error: "..." }
    const serverMsg =
      (data && typeof data === "object" && (data.error || data.message)) ||
      null;

    let message = serverMsg || `Ошибка сервера (HTTP ${status})`;

    if (status === 400) message = serverMsg || "Некорректные данные (400)";
    if (status === 404) message = serverMsg || "Не найдено (404)";
    if (status === 500) message = serverMsg || "Ошибка сервера (500)";

    const e = new Error(message);
    e.status = status;
    e.data = data;
    return e;
  }

  // Запрос ушёл, но ответа нет (сервер недоступен / CORS / сеть)
  if (err.request) {
    const e = new Error("Нет ответа от сервера. Проверь, запущен ли backend и CORS.");
    e.status = 0;
    return e;
  }

  // Ошибка при настройке запроса
  return new Error(err.message || "Ошибка запроса");
}

// Хелпер, чтобы не дублировать try/catch в каждом методе
async function safeRequest(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    throw toApiError(err);
  }
}

export const api = {
  getProducts: () => safeRequest(apiClient.get("/products")),

  getProductById: (id) =>
    safeRequest(apiClient.get(`/products/${id}`)),

  createProduct: (product) =>
    safeRequest(apiClient.post("/products", product)),

  updateProduct: (id, product) =>
    safeRequest(apiClient.patch(`/products/${id}`, product)),

  deleteProduct: async (id) => {
    await safeRequest(apiClient.delete(`/products/${id}`));
    return true;
  },
};