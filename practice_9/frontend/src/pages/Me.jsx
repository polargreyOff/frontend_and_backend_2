import { useAuth } from "../auth/AuthContext";

export default function Me() {
  const { user, reloadMe } = useAuth();

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <div>
          <h2 style={styles.title}>Профиль</h2>
          <p style={styles.subtitle}>Защищённая страница с данными текущего пользователя.</p>
        </div>

        <button style={styles.btn} onClick={reloadMe}>
          Обновить
        </button>
      </div>

      {user ? (
        <div style={styles.grid}>
          <Info label="ID" value={user.id} />
          <Info label="Email" value={user.email} />
          <Info label="Имя" value={user.first_name} />
          <Info label="Фамилия" value={user.last_name} />
          <Info label="Роль" value={user.role} />
          <Info label="Заблокирован" value={String(user.blocked)} />
        </div>
      ) : (
        <div style={styles.empty}>Данные профиля недоступны.</div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>{label}</div>
      <div>{value}</div>
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
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  title: { margin: 0, fontSize: 30, letterSpacing: "-0.04em" },
  subtitle: { margin: "8px 0 0", color: "#6d583d" },
  btn: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "1px solid rgba(94, 69, 40, 0.18)",
    background: "#f4e0bf",
    color: "#3f2f1d",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginTop: 16,
  },
  infoCard: {
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.5)",
    border: "1px solid rgba(94, 69, 40, 0.1)",
  },
  infoLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#7a5d3b",
    marginBottom: 6,
  },
  empty: { marginTop: 16, color: "#6d583d" },
};
