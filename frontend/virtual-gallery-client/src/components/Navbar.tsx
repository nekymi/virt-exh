import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          Virtual Gallery
        </Link>

        <nav className="nav">
          <NavLink to="/">Главная</NavLink>
          <NavLink to="/gallery">Галерея</NavLink>
          <NavLink to="/exhibitions">Выставки</NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/profile">Кабинет</NavLink>
              <NavLink to="/submit">Подача работы</NavLink>
            </>
          )}

          {user?.role === "Admin" && <NavLink to="/admin">Админка</NavLink>}

          {isAuthenticated ? (
            <>
              <span className="user-badge">
                {user?.name} ({user?.role})
              </span>
              <button className="nav-button" onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Вход</NavLink>
              <NavLink to="/register">Регистрация</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}