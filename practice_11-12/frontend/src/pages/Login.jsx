import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setMsg("");

    try {
      const { data } = await api.post("/api/auth/login", form);
      await login(data);
      navigate("/products");
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Вход</h2>
      <p style={styles.subtitle}>Войдите, чтобы работать с товарами согласно своей роли.</p>

      {msg ? <div style={styles.alert}>{msg}</div> : null}

      <form onSubmit={onSubmit} style={styles.form}>
        <label style={styles.label}>
          Email
          <input
            style={styles.input}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="admin@gmail.com"
          />
        </label>

        <label style={styles.label}>
          Пароль
          <input
            style={styles.input}
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="admin123"
          />
        </label>

        <button style={styles.primaryBtn} type="submit">
          Войти
        </button>
      </form>

      <div style={styles.demoBox}>
        <strong>Демо-аккаунты</strong>
        <div>Админ: admin@gmail.com / admin123</div>
        <div>Продавец: seller@gmail.com / seller123</div>
        <div>Пользователь: user@gmail.com / user123</div>
      </div>

      <p style={styles.bottomText}>
        Нет аккаунта? <Link to="/register">Создать</Link>
      </p>
    </div>
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
  title: { margin: 0, fontSize: 30, letterSpacing: "-0.04em" },
  subtitle: { margin: "8px 0 0", color: "#6d583d" },
  form: { display: "grid", gap: 12, marginTop: 18, maxWidth: 460 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(94, 69, 40, 0.16)",
    outline: "none",
    fontSize: 14,
    background: "rgba(255,255,255,0.72)",
  },
  primaryBtn: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(94, 69, 40, 0.16)",
    background: "#5f4d37",
    color: "#fff9f2",
    cursor: "pointer",
  },
  alert: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(182, 71, 58, 0.22)",
    background: "rgba(182, 71, 58, 0.08)",
    marginTop: 16,
    maxWidth: 460,
  },
  demoBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    background: "rgba(95, 77, 55, 0.08)",
    color: "#4a3d2d",
    display: "grid",
    gap: 4,
    maxWidth: 460,
  },
  bottomText: { marginBottom: 0, marginTop: 16, color: "#6d583d" },
};
