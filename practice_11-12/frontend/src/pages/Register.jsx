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

  async function onSubmit(event) {
    event.preventDefault();
    setMsg("");

    try {
      await api.post("/api/auth/register", form);
      navigate("/login");
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Регистрация</h2>
      <p style={styles.subtitle}>Новые аккаунты создаются с обычной ролью пользователя.</p>

      {msg ? <div style={styles.alert}>{msg}</div> : null}

      <form onSubmit={onSubmit} style={styles.form}>
        <label style={styles.label}>
          Email
          <input
            style={styles.input}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="tea@mail.com"
          />
        </label>

        <label style={styles.label}>
          Имя
          <input
            style={styles.input}
            value={form.first_name}
            onChange={(event) => setForm({ ...form, first_name: event.target.value })}
            placeholder="Ivan"
          />
        </label>

        <label style={styles.label}>
          Фамилия
          <input
            style={styles.input}
            value={form.last_name}
            onChange={(event) => setForm({ ...form, last_name: event.target.value })}
            placeholder="Ivanov"
          />
        </label>

        <label style={styles.label}>
          Пароль
          <input
            style={styles.input}
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="123456"
          />
        </label>

        <button style={styles.primaryBtn} type="submit">
          Создать аккаунт
        </button>
      </form>

      <p style={styles.bottomText}>
        Уже есть аккаунт? <Link to="/login">Перейти ко входу</Link>
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
  bottomText: { marginBottom: 0, marginTop: 16, color: "#6d583d" },
};
