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
          <h1>Чайный магазин</h1>
          <p className="hero-text">
            Уютный магазин чая с тщательно подобранной коллекцией ароматных сортов со всего мира. Здесь легко найти напиток для любого настроения — от классики на каждый день до редких чайных открытий.
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
