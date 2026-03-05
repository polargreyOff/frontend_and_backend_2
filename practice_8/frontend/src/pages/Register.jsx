import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      await api.post("/api/auth/register", form);
      navigate("/login");
    } catch (err) {
      setMsg(err?.response?.data?.error || err.message);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={{ marginTop: 0 }}>Register</h2>

      {msg ? <div style={styles.alert}>{msg}</div> : null}

      <form onSubmit={onSubmit} style={styles.form}>
        <label style={styles.label}>
          Email
          <input
            style={styles.input}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="test@mail.com"
          />
        </label>

        <label style={styles.label}>
          First name
          <input
            style={styles.input}
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            placeholder="Ivan"
          />
        </label>

        <label style={styles.label}>
          Last name
          <input
            style={styles.input}
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            placeholder="Ivanov"
          />
        </label>

        <label style={styles.label}>
          Password
          <input
            style={styles.input}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="123456"
          />
        </label>

        <button style={styles.primaryBtn} type="submit">
          Create account
        </button>
      </form>

      <p style={{ marginBottom: 0, opacity: 0.8 }}>
        Have an account? <Link to="/login">Login</Link>
      </p>
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
  form: { display: "grid", gap: 10 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    outline: "none",
    fontSize: 14,
  },
  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "rgba(0,0,0,0.9)",
    color: "white",
    cursor: "pointer",
  },
  alert: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,0,0,0.25)",
    background: "rgba(255,0,0,0.06)",
    marginBottom: 10,
  },
};