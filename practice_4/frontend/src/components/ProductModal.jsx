import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [rating, setRating] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(initialProduct?.name ?? "");
    setCategory(initialProduct?.category ?? "");
    setDescription(initialProduct?.description ?? "");
    setPrice(initialProduct?.price != null ? String(initialProduct.price) : "");
    setStock(initialProduct?.stock != null ? String(initialProduct.stock) : "");
    setRating(initialProduct?.rating != null ? String(initialProduct.rating) : "0");
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === "edit" ? "Редактирование товара" : "Добавление товара";

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();

    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    const parsedRating = Number(rating);

    if (!trimmedName) return alert("Введите название");
    if (!trimmedCategory) return alert("Введите категорию");
    if (!trimmedDescription) return alert("Введите описание");

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return alert("Введите корректную цену (>= 0)");
    }
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      return alert("Введите корректное количество на складе (>= 0)");
    }
    if (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 5) {
      return alert("Рейтинг должен быть 0–5");
    }

    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      category: trimmedCategory,
      description: trimmedDescription,
      price: parsedPrice,
      stock: parsedStock,
      rating: parsedRating,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modalHeader">
          <div className="modalTitle">{title}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="label">
            Категория
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Напр. Смартфоны"
            />
          </label>

          <label className="label">
            Описание
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>

          <div className="row2">
            <label className="label">
              Цена (₽)
              <input
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
              />
            </label>

            <label className="label">
              На складе
              <input
                className="input"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                inputMode="numeric"
              />
            </label>
          </div>

          <label className="label">
            Рейтинг (0–5)
            <input
              className="input"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              inputMode="numeric"
            />
          </label>

          <div className="modalFooter">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btnPrimary">
              {mode === "edit" ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}