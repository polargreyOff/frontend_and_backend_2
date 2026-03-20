import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const linkStyle = ({ isActive }) => ({
  padding: "10px 14px",
  borderRadius: "999px",
  textDecoration: "none",
  color: "#3f2f1d",
  background: isActive ? "rgba(112, 83, 47, 0.14)" : "transparent",
  border: isActive ? "1px solid rgba(112, 83, 47, 0.18)" : "1px solid transparent",
});

export default function NavBar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  function onLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header style={styles.header}>
      <Link to="/" style={styles.brand}>
        TeaShop
      </Link>

      <nav style={styles.nav}>
        {isAuthenticated ? (
          <>
            <NavLink to="/products" style={linkStyle}>
              Товары
            </NavLink>
            <NavLink to="/me" style={linkStyle}>
              Профиль
            </NavLink>
            {user?.role === "admin" ? (
              <NavLink to="/users" style={linkStyle}>
                Пользователи
              </NavLink>
            ) : null}
            <span style={styles.roleBadge}>{translateRole(user?.role || "user")}</span>
            <button onClick={onLogout} style={styles.btn}>
              Выйти
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" style={linkStyle}>
              Вход
            </NavLink>
            <NavLink to="/register" style={linkStyle}>
              Регистрация
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 16,
    border: "1px solid rgba(94, 69, 40, 0.14)",
    borderRadius: 24,
    marginBottom: 18,
    background: "rgba(255, 249, 241, 0.78)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 14px 34px rgba(94, 69, 40, 0.08)",
  },
  brand: {
    textDecoration: "none",
    color: "#3f2f1d",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.04em",
  },
  nav: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  roleBadge: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(95, 77, 55, 0.1)",
    color: "#5f4d37",
    textTransform: "uppercase",
    fontSize: 12,
    letterSpacing: "0.08em",
  },
  btn: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(94, 69, 40, 0.18)",
    background: "#5f4d37",
    color: "#fff9f2",
    cursor: "pointer",
  },
};

function translateRole(role) {
  const roleMap = {
    user: "пользователь",
    seller: "продавец",
    admin: "админ",
  };

  return roleMap[role] || role;
}
