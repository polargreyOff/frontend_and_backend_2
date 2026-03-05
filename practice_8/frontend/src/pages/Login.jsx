import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { setToken } from "../auth/token";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    try {
      const { data } = await api.post("/api/auth/login", form);
      setToken(data.accessToken);
      navigate("/me");
    } catch (err) {
      setMsg(err?.response?.data?.error || err.message);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={{ marginTop: 0 }}>Login</h2>

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
          Sign in
        </button>
      </form>

      <p style={{ marginBottom: 0, opacity: 0.8 }}>
        No account? <Link to="/register">Register</Link>
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