import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import Me from "./pages/Me";
import Users from "./pages/Users";
import "./App.css";

export default function App() {
  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <div className="app-layout">
        <NavBar />

        <section className="hero-card">
          <p className="eyebrow">Practice 9-11</p>
          <h1>Чайный магазин</h1>
          <p className="hero-text">
            Учебный проект на React с обновлением токенов, CRUD товаров и
            административным управлением пользователями.
          </p>
        </section>

        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me"
            element={
              <ProtectedRoute>
                <Me />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<div className="page-card">Страница не найдена.</div>} />
        </Routes>

        <footer className="footer-note">
          Backend: <code>http://localhost:3000</code> | Swagger: <code>/api-docs</code>
        </footer>
      </div>
    </div>
  );
}
