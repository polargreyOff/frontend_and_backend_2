import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
  return (
    <div className="card">
      <h3 className="cardTitle">{product.name}</h3>

      <div className="category">{product.category}</div>
      <div className="desc">{product.description}</div>

      <div className="product-image">
        <img src={product.url} alt="картинка товара" />
      </div>

      <div className="price">{product.price} ₽</div>

      <div className="metaRow">
        <div className="stock">
          {product.stock > 0 ? `В наличии: ${product.stock}` : "Нет в наличии"}
        </div>

        {Number.isFinite(product.rating) && product.rating > 0 && (
          <div className="rating">{"⭐".repeat(Math.min(5, product.rating))}</div>
        )}
      </div>

      <div className="actions">
        <button className="btn" onClick={() => onEdit(product)}>
          Редактировать
        </button>
        <button className="btn btnDanger" onClick={() => onDelete(product.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}