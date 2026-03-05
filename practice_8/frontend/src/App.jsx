import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import Me from "./pages/Me";

export default function App() {
  return (
    <div style={styles.page}>
      <NavBar />

      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/products" element={<Products />} />

        <Route
          path="/me"
          element={
            <ProtectedRoute>
              <Me />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<div>404</div>} />
      </Routes>

      <footer style={{ opacity: 0.7, marginTop: 16 }}>
        Backend: <code>http://localhost:3000</code> • Swagger:{" "}
        <code>/api-docs</code>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 980,
    margin: "0 auto",
    padding: 16,
    fontFamily:
      'system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
    background: "rgba(0,0,0,0.02)",
    minHeight: "100vh",
  },
};