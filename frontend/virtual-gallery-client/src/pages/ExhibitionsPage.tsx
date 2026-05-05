import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { exhibitionsApi } from "../api/exhibitionsApi";
import type { Exhibition } from "../types/exhibition";

type ExhibitionFilter = "all" | "submission" | "active" | "upcoming" | "finished";

type ExhibitionStatus = {
  label: string;
  variant: "success" | "warning" | "muted" | "danger";
  description: string;
};

function formatDate(value: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getArtworkCount(exhibition: Exhibition): number {
  const possibleExhibition = exhibition as Exhibition & {
    artworks?: unknown[];
    artworksCount?: number;
    artworkCount?: number;
  };

  if (typeof possibleExhibition.artworksCount === "number") {
    return possibleExhibition.artworksCount;
  }

  if (typeof possibleExhibition.artworkCount === "number") {
    return possibleExhibition.artworkCount;
  }

  if (Array.isArray(possibleExhibition.artworks)) {
    return possibleExhibition.artworks.length;
  }

  return 0;
}

function getExhibitionStatus(exhibition: Exhibition): ExhibitionStatus {
  const now = new Date();

  const submissionStart = new Date(exhibition.submissionStartDate);
  const submissionEnd = new Date(exhibition.submissionEndDate);
  const start = new Date(exhibition.startDate);
  const end = new Date(exhibition.endDate);

  if (now >= submissionStart && now <= submissionEnd) {
    return {
      label: "Приём заявок открыт",
      variant: "success",
      description: "Авторы могут отправлять работы на участие",
    };
  }

  if (now > submissionEnd && now < start) {
    return {
      label: "Скоро открытие",
      variant: "warning",
      description: "Приём завершён, выставка готовится к запуску",
    };
  }

  if (now >= start && now <= end) {
    return {
      label: "Выставка идёт",
      variant: "success",
      description: "Экспозиция доступна для просмотра",
    };
  }

  if (now > end) {
    return {
      label: "Завершена",
      variant: "muted",
      description: "Выставка завершила свою работу",
    };
  }

  return {
    label: "Планируется",
    variant: "warning",
    description: "Выставка будет открыта позже",
  };
}

function getFilterByStatus(exhibition: Exhibition): ExhibitionFilter {
  const now = new Date();

  const submissionStart = new Date(exhibition.submissionStartDate);
  const submissionEnd = new Date(exhibition.submissionEndDate);
  const start = new Date(exhibition.startDate);
  const end = new Date(exhibition.endDate);

  if (now >= submissionStart && now <= submissionEnd) {
    return "submission";
  }

  if (now >= start && now <= end) {
    return "active";
  }

  if (now < submissionStart || (now > submissionEnd && now < start)) {
    return "upcoming";
  }

  if (now > end) {
    return "finished";
  }

  return "all";
}

function getDaysLeftLabel(exhibition: Exhibition): string {
  const now = new Date();
  const start = new Date(exhibition.startDate);
  const end = new Date(exhibition.endDate);
  const submissionEnd = new Date(exhibition.submissionEndDate);

  const dayMs = 1000 * 60 * 60 * 24;

  if (now <= submissionEnd) {
    const days = Math.max(0, Math.ceil((submissionEnd.getTime() - now.getTime()) / dayMs));
    return days === 0 ? "Приём завершается сегодня" : `До конца приёма: ${days} дн.`;
  }

  if (now < start) {
    const days = Math.max(0, Math.ceil((start.getTime() - now.getTime()) / dayMs));
    return days === 0 ? "Открытие сегодня" : `До открытия: ${days} дн.`;
  }

  if (now <= end) {
    const days = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / dayMs));
    return days === 0 ? "Последний день выставки" : `До завершения: ${days} дн.`;
  }

  return "Архивная выставка";
}

function getFilterTitle(filter: ExhibitionFilter): string {
  if (filter === "submission") {
    return "Приём заявок";
  }

  if (filter === "active") {
    return "Идут сейчас";
  }

  if (filter === "upcoming") {
    return "Будущие";
  }

  if (filter === "finished") {
    return "Завершённые";
  }

  return "Все выставки";
}

function getFilterDescription(filter: ExhibitionFilter): string {
  if (filter === "submission") {
    return "Выставки, куда пользователи сейчас могут отправить свои работы.";
  }

  if (filter === "active") {
    return "Выставки, которые уже открыты для просмотра в виртуальном зале.";
  }

  if (filter === "upcoming") {
    return "Запланированные выставки и экспозиции, которые скоро начнутся.";
  }

  if (filter === "finished") {
    return "Архивные выставки, завершившие свою работу.";
  }

  return "Полный список выставок виртуальной арт-галереи.";
}

export function ExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [activeFilter, setActiveFilter] = useState<ExhibitionFilter>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadExhibitions = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await exhibitionsApi.getAll();
        setExhibitions(data);
      } catch (requestError) {
        console.error(requestError);
        setError("Не удалось загрузить выставки. Проверь, запущен ли backend.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadExhibitions();
  }, []);

  const counters = useMemo(() => {
    return {
      all: exhibitions.length,
      submission: exhibitions.filter((exhibition) => getFilterByStatus(exhibition) === "submission").length,
      active: exhibitions.filter((exhibition) => getFilterByStatus(exhibition) === "active").length,
      upcoming: exhibitions.filter((exhibition) => getFilterByStatus(exhibition) === "upcoming").length,
      finished: exhibitions.filter((exhibition) => getFilterByStatus(exhibition) === "finished").length,
    };
  }, [exhibitions]);

  const filteredExhibitions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return exhibitions
      .filter((exhibition) => {
        if (activeFilter === "all") {
          return true;
        }

        return getFilterByStatus(exhibition) === activeFilter;
      })
      .filter((exhibition) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          exhibition.title.toLowerCase().includes(normalizedSearch) ||
          exhibition.theme.toLowerCase().includes(normalizedSearch) ||
          exhibition.description.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((first, second) => {
        return new Date(first.startDate).getTime() - new Date(second.startDate).getTime();
      });
  }, [exhibitions, activeFilter, search]);

  const nextExhibition = useMemo(() => {
    const now = new Date();

    return exhibitions
      .filter((exhibition) => new Date(exhibition.startDate) >= now)
      .sort((first, second) => {
        return new Date(first.startDate).getTime() - new Date(second.startDate).getTime();
      })[0];
  }, [exhibitions]);

  return (
    <div className="exhibitions-page">
      <section className="exhibitions-hero">
        <div className="exhibitions-hero-content">
          <div className="eyebrow">Виртуальные экспозиции</div>

          <h1>Выставки цифровой арт-галереи</h1>

          <p>
            Здесь собраны тематические онлайн-выставки: открытые для подачи работ,
            текущие экспозиции и архив завершённых проектов. Каждую выставку можно
            открыть в 3D-зале и посмотреть работы участников.
          </p>

          <div className="exhibitions-hero-actions">
            <Link to="/gallery" className="secondary-link">
              Смотреть галерею
            </Link>

            <Link to="/submit" className="primary-link">
              Подать работу
            </Link>
          </div>
        </div>

        <div className="exhibitions-hero-panel">
          <div className="hero-stat-card">
            <span>{counters.all}</span>
            <strong>Всего выставок</strong>
          </div>

          <div className="hero-stat-card">
            <span>{counters.submission}</span>
            <strong>Приём заявок</strong>
          </div>

          <div className="hero-stat-card">
            <span>{counters.active}</span>
            <strong>Идут сейчас</strong>
          </div>

          {nextExhibition ? (
            <div className="next-exhibition-card">
              <small>Ближайшая выставка</small>
              <strong>{nextExhibition.title}</strong>
              <span>{formatDate(nextExhibition.startDate)}</span>
            </div>
          ) : (
            <div className="next-exhibition-card">
              <small>Ближайшая выставка</small>
              <strong>Пока не запланирована</strong>
              <span>Создайте выставку в админке</span>
            </div>
          )}
        </div>
      </section>

      <section className="exhibitions-toolbar">
        <div className="exhibition-tabs">
          <button
            type="button"
            className={activeFilter === "all" ? "active" : ""}
            onClick={() => setActiveFilter("all")}
          >
            Все
            <span>{counters.all}</span>
          </button>

          <button
            type="button"
            className={activeFilter === "submission" ? "active" : ""}
            onClick={() => setActiveFilter("submission")}
          >
            Приём заявок
            <span>{counters.submission}</span>
          </button>

          <button
            type="button"
            className={activeFilter === "active" ? "active" : ""}
            onClick={() => setActiveFilter("active")}
          >
            Идут сейчас
            <span>{counters.active}</span>
          </button>

          <button
            type="button"
            className={activeFilter === "upcoming" ? "active" : ""}
            onClick={() => setActiveFilter("upcoming")}
          >
            Будущие
            <span>{counters.upcoming}</span>
          </button>

          <button
            type="button"
            className={activeFilter === "finished" ? "active" : ""}
            onClick={() => setActiveFilter("finished")}
          >
            Архив
            <span>{counters.finished}</span>
          </button>
        </div>

        <div className="exhibition-search">
          <input
            type="search"
            placeholder="Поиск по названию, теме или описанию"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      <section className="section-header exhibitions-list-header">
        <div>
          <h1>{getFilterTitle(activeFilter)}</h1>
          <p>{getFilterDescription(activeFilter)}</p>
        </div>

        <span className="status-badge">
          Найдено: {filteredExhibitions.length}
        </span>
      </section>

      {isLoading && (
        <div className="exhibitions-state-card">
          <div className="loader-dot" />
          <h2>Загружаем выставки</h2>
          <p>Получаем данные с сервера виртуальной галереи.</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="exhibitions-state-card error">
          <h2>Ошибка загрузки</h2>
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && filteredExhibitions.length === 0 && (
        <div className="exhibitions-state-card">
          <h2>Выставки не найдены</h2>
          <p>
            Попробуй изменить фильтр или поисковый запрос. Если выставок ещё нет,
            создай первую выставку в админке.
          </p>
        </div>
      )}

      {!isLoading && !error && filteredExhibitions.length > 0 && (
        <div className="exhibition-list">
          {filteredExhibitions.map((exhibition, index) => {
            const status = getExhibitionStatus(exhibition);
            const artworksCount = getArtworkCount(exhibition);

            return (
              <article className="exhibition-showcase-card" key={exhibition.id}>
                <div className="exhibition-card-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="exhibition-card-main">
                  <div className="exhibition-card-topline">
                    <span className={`exhibition-status ${status.variant}`}>
                      {status.label}
                    </span>

                    <span className="exhibition-days-left">
                      {getDaysLeftLabel(exhibition)}
                    </span>
                  </div>

                  <h2>{exhibition.title}</h2>

                  <p className="exhibition-theme">
                    Тема: {exhibition.theme}
                  </p>

                  <p className="exhibition-description">
                    {exhibition.description}
                  </p>

                  <div className="exhibition-meta-grid">
                    <div>
                      <span>Приём заявок</span>
                      <strong>
                        {formatShortDate(exhibition.submissionStartDate)} —{" "}
                        {formatShortDate(exhibition.submissionEndDate)}
                      </strong>
                    </div>

                    <div>
                      <span>Проведение</span>
                      <strong>
                        {formatShortDate(exhibition.startDate)} —{" "}
                        {formatShortDate(exhibition.endDate)}
                      </strong>
                    </div>

                    <div>
                      <span>Работы в зале</span>
                      <strong>{artworksCount} / 30</strong>
                    </div>
                  </div>

                  <div className="exhibition-card-actions">
                    <Link
                      to={`/exhibitions/${exhibition.id}`}
                      className="secondary-link"
                    >
                      Подробнее
                    </Link>

                    <Link
  to={`/exhibitions/${exhibition.id}/virtual-room`}
  className="primary-link"
>
  Открыть 3D-зал
</Link>
                  </div>
                </div>

                <div className="exhibition-card-visual">
                  <div className="gallery-wall">
                    <div className="gallery-frame frame-large" />
                    <div className="gallery-frame frame-small" />
                    <div className="gallery-frame frame-tall" />
                  </div>

                  <div className="visual-caption">
                    <strong>{status.description}</strong>
                    <span>{formatDate(exhibition.startDate)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}