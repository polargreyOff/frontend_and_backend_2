import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const emptyForm = {
  title: "",
  category: "",
  description: "",
  price: "",
};

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lookupId, setLookupId] = useState("");
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [msg, setMsg] = useState("");

  const canEdit = user?.role === "seller" || user?.role === "admin";
  const canDelete = user?.role === "admin";

  async function loadProducts() {
    try {
      setMsg("");
      const { data } = await api.get("/api/products");
      setProducts(data);

      if (!selectedId && data[0]) {
        setSelectedId(data[0].id);
        await loadProductById(data[0].id);
      }
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  async function loadProductById(id = lookupId || selectedId) {
    if (!id) return;

    try {
      setMsg("");
      const { data } = await api.get(`/api/products/${id}`);
      setSelectedId(data.id);
      setLookupId(data.id);
      setSelectedProduct(data);
      setEditForm({
        title: data.title,
        category: data.category,
        description: data.description,
        price: String(data.price),
      });
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function createProduct(event) {
    event.preventDefault();

    try {
      setMsg("");
      const payload = {
        ...createForm,
        price: Number(createForm.price),
      };
      const { data } = await api.post("/api/products", payload);
      setCreateForm(emptyForm);
      await loadProducts();
      await loadProductById(data.id);
      setMsg("Товар создан.");
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  async function updateProduct(event) {
    event.preventDefault();

    try {
      setMsg("");
      const payload = {
        ...editForm,
        price: Number(editForm.price),
      };
      const { data } = await api.put(`/api/products/${selectedId}`, payload);
      setSelectedProduct(data);
      await loadProducts();
      setMsg("Товар обновлён.");
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  async function deleteProduct() {
    if (!selectedId) return;

    try {
      setMsg("");
      await api.delete(`/api/products/${selectedId}`);
      setSelectedId("");
      setSelectedProduct(null);
      setLookupId("");
      setEditForm(emptyForm);
      await loadProducts();
      setMsg("Товар удалён.");
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Товары</h2>
          <p style={styles.subtitle}>
            Пользователь может просматривать товары, продавец редактировать, а админ удалять.
          </p>
        </div>

        <button style={styles.actionButton} onClick={loadProducts}>
          Обновить список
        </button>
      </div>

      {msg ? <div style={styles.alert}>{msg}</div> : null}

      <div style={styles.layout}>
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Каталог</h3>
          <div style={styles.stack}>
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                style={{
                  ...styles.listButton,
                  ...(selectedId === product.id ? styles.listButtonActive : {}),
                }}
                onClick={async () => {
                  setSelectedId(product.id);
                  await loadProductById(product.id);
                }}
              >
                <strong>{product.title}</strong>
                <span>
                  {product.category} | {product.price} ₽
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Карточка товара</h3>

          <div style={styles.lookupRow}>
            <input
              style={styles.input}
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
              placeholder="Введите id товара"
            />
            <button style={styles.secondaryButton} type="button" onClick={() => loadProductById()}>
              Найти по id
            </button>
          </div>

          {selectedProduct ? (
            <div style={styles.detailCard}>
              <div style={styles.detailMeta}>ID: {selectedProduct.id}</div>
              <h3 style={styles.detailTitle}>{selectedProduct.title}</h3>
              <div style={styles.detailMeta}>{selectedProduct.category}</div>
              <p style={styles.detailText}>{selectedProduct.description}</p>
              <strong>{selectedProduct.price} ₽</strong>
            </div>
          ) : (
            <div style={styles.empty}>Выберите товар из списка или запросите его по id.</div>
          )}

          {canEdit && selectedProduct ? (
            <form onSubmit={updateProduct} style={styles.form}>
              <h3 style={styles.sectionTitle}>Редактирование товара</h3>

              <label style={styles.label}>
                Название
                <input
                  style={styles.input}
                  value={editForm.title}
                  onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
                />
              </label>

              <label style={styles.label}>
                Категория
                <input
                  style={styles.input}
                  value={editForm.category}
                  onChange={(event) => setEditForm({ ...editForm, category: event.target.value })}
                />
              </label>

              <label style={styles.label}>
                Описание
                <textarea
                  style={styles.textarea}
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm({ ...editForm, description: event.target.value })
                  }
                />
              </label>

              <label style={styles.label}>
                Цена
                <input
                  style={styles.input}
                  type="number"
                  value={editForm.price}
                  onChange={(event) => setEditForm({ ...editForm, price: event.target.value })}
                />
              </label>

              <div style={styles.rowButtons}>
                <button style={styles.primaryButton} type="submit">
                  Сохранить изменения
                </button>
                {canDelete ? (
                  <button style={styles.dangerButton} type="button" onClick={deleteProduct}>
                    Удалить товар
                  </button>
                ) : null}
              </div>
            </form>
          ) : null}
        </div>
      </div>

      {canEdit ? (
        <div style={{ ...styles.panel, marginTop: 16 }}>
          <h3 style={styles.panelTitle}>Создание товара</h3>
          <form onSubmit={createProduct} style={styles.form}>
            <label style={styles.label}>
              Название
              <input
                style={styles.input}
                value={createForm.title}
                onChange={(event) => setCreateForm({ ...createForm, title: event.target.value })}
              />
            </label>

            <label style={styles.label}>
              Категория
              <input
                style={styles.input}
                value={createForm.category}
                onChange={(event) =>
                  setCreateForm({ ...createForm, category: event.target.value })
                }
              />
            </label>

            <label style={styles.label}>
              Описание
              <textarea
                style={styles.textarea}
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm({ ...createForm, description: event.target.value })
                }
              />
            </label>

            <label style={styles.label}>
              Цена
              <input
                style={styles.input}
                type="number"
                value={createForm.price}
                onChange={(event) => setCreateForm({ ...createForm, price: event.target.value })}
              />
            </label>

            <button style={styles.primaryButton} type="submit">
              Создать товар
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

const styles = {
  card: {
    background: "rgba(255, 250, 243, 0.82)",
    border: "1px solid rgba(94, 69, 40, 0.14)",
    borderRadius: 28,
    boxShadow: "0 18px 50px rgba(94, 69, 40, 0.08)",
    backdropFilter: "blur(10px)",
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  title: { margin: 0, fontSize: 30, letterSpacing: "-0.04em" },
  subtitle: { margin: "8px 0 0", color: "#6d583d" },
  actionButton: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid rgba(94, 69, 40, 0.18)",
    background: "#f4e0bf",
    cursor: "pointer",
  },
  alert: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(182, 71, 58, 0.22)",
    background: "rgba(182, 71, 58, 0.08)",
    marginTop: 16,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16,
    marginTop: 18,
  },
  panel: {
    padding: 18,
    borderRadius: 22,
    background: "rgba(255,255,255,0.55)",
    border: "1px solid rgba(94, 69, 40, 0.1)",
  },
  panelTitle: { marginTop: 0 },
  stack: { display: "grid", gap: 10 },
  listButton: {
    display: "grid",
    gap: 4,
    textAlign: "left",
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(94, 69, 40, 0.12)",
    background: "#fff",
    cursor: "pointer",
  },
  listButtonActive: {
    background: "rgba(244, 224, 191, 0.7)",
  },
  lookupRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
  },
  detailCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    background: "rgba(255,255,255,0.58)",
  },
  detailTitle: { marginBottom: 8 },
  detailMeta: { color: "#816a50", fontSize: 13 },
  detailText: { color: "#554430" },
  sectionTitle: { marginBottom: 0 },
  form: { display: "grid", gap: 12, marginTop: 16 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(94, 69, 40, 0.16)",
    background: "rgba(255,255,255,0.78)",
  },
  textarea: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(94, 69, 40, 0.16)",
    minHeight: 96,
    resize: "vertical",
    background: "rgba(255,255,255,0.78)",
    font: "inherit",
  },
  rowButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(94, 69, 40, 0.16)",
    background: "#5f4d37",
    color: "#fff9f2",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(94, 69, 40, 0.16)",
    background: "#f4e0bf",
    cursor: "pointer",
  },
  dangerButton: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(182, 71, 58, 0.16)",
    background: "#b6473a",
    color: "#fff9f2",
    cursor: "pointer",
  },
  empty: {
    marginTop: 14,
    color: "#6d583d",
  },
};
