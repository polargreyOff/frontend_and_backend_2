import React, { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import ProductsList from "../components/ProductsList";
import ProductModal from "../components/ProductModal";
import "./ProductsPage.css";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingProduct, setEditingProduct] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
      alert("Ошибка загрузки товаров");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openCreate = () => {
    setModalMode("create");
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setModalMode("edit");
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Удалить товар?");
    if (!ok) return;

    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      alert("Ошибка удаления товара");
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === "create") {
        const created = await api.createProduct(payload);
        setProducts((prev) => [...prev, created]);
      } else {
        const updated = await api.updateProduct(payload.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === payload.id ? updated : p)));
      }
      closeModal();
    } catch (e) {
      console.error(e);
      alert("Ошибка сохранения товара");
    }
  };

  return (
    <div className="page">
      <div className="topbar">
        <h1 className="title">Интернет-магазин электроники</h1>
        <button className="btn btnPrimary" onClick={openCreate}>
          + Добавить
        </button>
      </div>

      {loading ? (
        <div className="empty">Загрузка...</div>
      ) : (
        <ProductsList products={products} onEdit={openEdit} onDelete={handleDelete} />
      )}

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initialProduct={editingProduct}
        onClose={closeModal}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}