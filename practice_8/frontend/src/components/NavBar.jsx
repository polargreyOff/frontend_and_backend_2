import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearToken, getToken } from "../auth/token";

const linkStyle = ({ isActive }) => ({
  padding: "8px 10px",
  borderRadius: 10,
  textDecoration: "none",
  color: "black",
  background: isActive ? "rgba(0,0,0,0.08)" : "transparent",
});

export default function NavBar() {
  const navigate = useNavigate();
  const isAuthed = Boolean(getToken());

  function logout() {
    clearToken();
    navigate("/login");
  }

  return (
    <header style={styles.header}>
      <Link to="/" style={{ textDecoration: "none", color: "black" }}>
        <b>JWT Frontend</b>
      </Link>

      <nav style={styles.nav}>
        <NavLink to="/products" style={linkStyle}>
          Products
        </NavLink>
        <NavLink to="/me" style={linkStyle}>
          Me
        </NavLink>

        {!isAuthed ? (
          <>
            <NavLink to="/login" style={linkStyle}>
              Login
            </NavLink>
            <NavLink to="/register" style={linkStyle}>
              Register
            </NavLink>
          </>
        ) : (
          <button onClick={logout} style={styles.btn}>
            Logout
          </button>
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
    padding: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    marginBottom: 14,
    background: "white",
  },
  nav: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  btn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "white",
    cursor: "pointer",
  },
};