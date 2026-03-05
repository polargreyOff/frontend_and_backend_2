import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    try {
      const { data } = await api.get("/api/products");
      setProducts(data);
    } catch (err) {
      setMsg(err?.response?.data?.error || err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <h2 style={{ margin: 0 }}>Products</h2>
        <button style={styles.btn} onClick={load}>
          Refresh
        </button>
      </div>

      {msg ? <div style={styles.alert}>{msg}</div> : null}

      <div style={styles.list}>
        {products.length ? (
          products.map((p) => (
            <div key={p.id} style={styles.item}>
              <div style={styles.itemTop}>
                <b>{p.title}</b>
                <span>{p.price} ₽</span>
              </div>
              <div style={{ opacity: 0.8 }}>{p.category}</div>
              <div style={{ fontSize: 13, opacity: 0.75 }}>{p.description}</div>
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                id: <code>{p.id}</code>
              </div>
            </div>
          ))
        ) : (
          <div style={{ opacity: 0.7 }}>No products</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 14,
    background: "white",
  },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  btn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    cursor: "pointer",
  },
  list: { display: "grid", gap: 10, marginTop: 12 },
  item: {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 10,
    padding: 10,
  },
  itemTop: { display: "flex", justifyContent: "space-between" },
  alert: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,0,0,0.25)",
    background: "rgba(255,0,0,0.06)",
    marginTop: 10,
  },
};