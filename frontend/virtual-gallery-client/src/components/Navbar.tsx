import { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth-context";

type NavItem = {
  label: string;
  to: string;
  protected?: boolean;
};

const mainNavItems: NavItem[] = [
  { label: "Главная", to: "/" },
  { label: "Галерея", to: "/gallery" },
  { label: "Выставки", to: "/exhibitions" },
  { label: "Кабинет", to: "/profile", protected: true },
];

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || (email && email.trim()) || "Пользователь";
  const parts = source.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function isAdminRole(role: unknown): boolean {
  return role === "Admin" || role === "admin" || role === 1;
}

export function Navbar() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!auth) {
    return null;
  }

  const { user, isAuthenticated, logout } = auth;
  const isAdmin = isAdminRole(user?.role);

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  const visibleNavItems = mainNavItems.filter((item) => {
    if (item.protected && !isAuthenticated) {
      return false;
    }

    return true;
  });

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo" onClick={closeMenu}>
          <span className="logo-mark" aria-hidden="true">
            <span className="logo-square logo-square-top-left">В</span>
            <span className="logo-square logo-square-top-right" />
            <span className="logo-square logo-square-bottom-left" />
            <span className="logo-square logo-square-bottom-right">Г</span>
          </span>

          <span className="logo-text">
            <span className="logo-title">Виртуальная галерея</span>
          </span>
        </Link>

        <button
          type="button"
          className={`mobile-menu-button ${isMobileMenuOpen ? "is-open" : ""}`}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Открыть меню"
          aria-expanded={isMobileMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar-panel ${isMobileMenuOpen ? "is-open" : ""}`}>
          <nav className="nav" aria-label="Основная навигация">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={closeMenu}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="navbar-actions">
            {isAuthenticated && (
              <NavLink
                to="/submit"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `submit-nav-button ${isActive ? "active" : ""}`
                }
              >
                Подать работу
              </NavLink>
            )}

            {isAuthenticated && isAdmin && (
              <NavLink
                to="/admin"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `admin-nav-button ${isActive ? "active" : ""}`
                }
              >
                Админка
              </NavLink>
            )}

            {isAuthenticated && user ? (
              <>
                <Link
                  to="/profile"
                  className="user-chip"
                  onClick={closeMenu}
                  title={user.email}
                >
                  <span className="user-avatar">
                    {getInitials(user.name, user.email)}
                  </span>

                  <span className="user-chip-text">
                    <span className="user-name">{user.name}</span>
                    <span className="user-role">
                      {isAdmin ? "Администратор" : "Участник"}
                    </span>
                  </span>
                </Link>

                <button type="button" className="logout-button" onClick={handleLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className={({ isActive }) => `auth-link ${isActive ? "active" : ""}`}
                >
                  Войти
                </NavLink>

                <NavLink
                  to="/register"
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `auth-link auth-link-primary ${isActive ? "active" : ""}`
                  }
                >
                  Регистрация
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}