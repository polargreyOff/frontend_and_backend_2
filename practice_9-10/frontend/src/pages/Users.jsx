import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const initialForm = {
  email: "",
  first_name: "",
  last_name: "",
  role: "user",
  blocked: false,
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [msg, setMsg] = useState("");
  

  async function loadUsers() {
    try {
      setMsg("");
      const { data } = await api.get("/api/users");
      setUsers(data);
      if (!selectedId && data[0]) {
        setSelectedId(data[0].id);
        await loadUser(data[0].id);
      }
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  async function loadUser(id = selectedId) {
    if (!id) return;

    try {
      setMsg("");
      const { data } = await api.get(`/api/users/${id}`);
      setSelectedUser(data);
      setForm({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        blocked: Boolean(data.blocked),
      });
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function updateUser(event) {
    event.preventDefault();

    try {
      setMsg("");
      const { data } = await api.put(`/api/users/${selectedId}`, form);
      setSelectedUser(data);
      await loadUsers();
      setMsg("Пользователь обновлён.");
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  async function blockUser() {
    if (!selectedId) return;
    if (selectedId === currentUser?.id) {
      setMsg("Нельзя заблокировать самого себя.");
      return;
    }

    try {
      setMsg("");
      const { data } = await api.delete(`/api/users/${selectedId}`);
      setSelectedUser(data);
      setForm((current) => ({ ...current, blocked: true }));
      await loadUsers();
      setMsg("Пользователь заблокирован.");
    } catch (error) {
      setMsg(error?.response?.data?.error || error.message);
    }
  }

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Пользователи</h2>
          <p style={styles.subtitle}>Инструменты администратора для просмотра, редактирования и блокировки пользователей.</p>
        </div>

        <button style={styles.actionButton} onClick={loadUsers}>
          Обновить пользователей
        </button>
      </div>

      {msg ? <div style={styles.alert}>{msg}</div> : null}

      <div style={styles.layout}>
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Список пользователей</h3>
          <div style={styles.stack}>
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                style={{
                  ...styles.listButton,
                  ...(selectedId === user.id ? styles.listButtonActive : {}),
                }}
                onClick={async () => {
                  setSelectedId(user.id);
                  await loadUser(user.id);
                }}
              >
                <strong>{user.email}</strong>
                <span>
                  {user.role} | заблокирован: {String(user.blocked)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Выбранный пользователь</h3>
          {selectedUser ? (
            <form onSubmit={updateUser} style={styles.form}>
              <label style={styles.label}>
                Email
                <input
                  style={styles.input}
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </label>

              <label style={styles.label}>
                Имя
                <input
                  style={styles.input}
                  value={form.first_name}
                  onChange={(event) => setForm({ ...form, first_name: event.target.value })}
                />
              </label>

              <label style={styles.label}>
                Фамилия
                <input
                  style={styles.input}
                  value={form.last_name}
                  onChange={(event) => setForm({ ...form, last_name: event.target.value })}
                />
              </label>

              <label style={styles.label}>
                Роль
                <select
                  style={styles.input}
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                >
                  <option value="user">user</option>
                  <option value="seller">seller</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={form.blocked}
                  onChange={(event) => setForm({ ...form, blocked: event.target.checked })}
                />
                Заблокирован
              </label>

              <div style={styles.rowButtons}>
                <button style={styles.primaryButton} type="submit">
                  Сохранить пользователя
                </button>
                <button style={styles.secondaryButton} type="button" onClick={() => loadUser()}>
                  Обновить данные
                </button>
                <button
                  style={{
                    ...styles.dangerButton,
                    ...(selectedId === currentUser?.id ? styles.disabledButton : {}),
                  }}
                  type="button"
                  onClick={blockUser}
                  disabled={selectedId === currentUser?.id}
                  title={selectedId === currentUser?.id ? "Нельзя заблокировать самого себя" : ""}
                >
                  Заблокировать
                </button>
              </div>
            </form>
          ) : (
            <div style={styles.empty}>Выберите пользователя из списка.</div>
          )}
        </div>
      </div>
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
  form: { display: "grid", gap: 12 },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(94, 69, 40, 0.16)",
    background: "rgba(255,255,255,0.78)",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
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
  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  empty: { color: "#6d583d" },
};
