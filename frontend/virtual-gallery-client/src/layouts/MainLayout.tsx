import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export function MainLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="container page-content">
        <Outlet />
      </main>
    </div>
  );
}