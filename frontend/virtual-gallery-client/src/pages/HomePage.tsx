import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <section className="hero">
      <div className="hero-card">
        <p className="eyebrow">Виртуальная выставка</p>
        <h1>Платформа для тематических онлайн-выставок и 3D-просмотра работ</h1>
        <p className="hero-text">
          Пользователи могут подавать свои работы на конкретные выставки, а
          администратор модерирует их и публикует в галерее.
        </p>

        <div className="hero-actions">
          <Link to="/exhibitions" className="primary-link">
            Смотреть выставки
          </Link>
          <Link to="/gallery" className="secondary-link">
            Открыть галерею
          </Link>
        </div>
      </div>
    </section>
  );
}