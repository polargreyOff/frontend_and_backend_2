import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Me() {
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    try {
      const { data } = await api.get("/api/auth/me");
      setMe(data);
    } catch (err) {
      setMe(null);
      setMsg(err?.response?.data?.error || err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <h2 style={{ margin: 0 }}>Me</h2>
        <button style={styles.btn} onClick={load}>
          Refresh
        </button>
      </div>

      {msg ? <div style={styles.alert}>{msg}</div> : null}

      {me ? (
        <pre style={styles.pre}>{JSON.stringify(me, null, 2)}</pre>
      ) : (
        <div style={{ opacity: 0.75, marginTop: 12 }}>
          Нет данных. Скорее всего нужно войти.
        </div>
      )}
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
  pre: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    background: "rgba(0,0,0,0.05)",
    overflow: "auto",
    fontSize: 13,
  },
  alert: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,0,0,0.25)",
    background: "rgba(255,0,0,0.06)",
    marginTop: 10,
  },
};