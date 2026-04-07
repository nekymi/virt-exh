import { useCallback, useEffect, useState } from "react";
import { adminArtworksApi } from "../api/adminArtworksApi";
import { exhibitionsApi, type CreateExhibitionRequest } from "../api/exhibitionsApi";
import { submissionsApi } from "../api/submissionsApi";
import type { Artwork } from "../types/artwork";
import type { Submission } from "../types/submission";
import { formatDate } from "../utils/formatDate";

export function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [submissionStartDate, setSubmissionStartDate] = useState("");
  const [submissionEndDate, setSubmissionEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [createError, setCreateError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [submissionsData, artworksData] = await Promise.all([
        submissionsApi.getAll(),
        adminArtworksApi.getAll(),
      ]);
      setSubmissions(submissionsData);
      setArtworks(artworksData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleReview = async (id: string, approve: boolean) => {
    const adminComment = window.prompt(
      approve
        ? "Комментарий администратора (необязательно):"
        : "Укажите причину отклонения:"
    );

    try {
      await submissionsApi.review(id, {
        approve,
        adminComment: adminComment ?? "",
      });
      await loadData();
    } catch {
      alert("Не удалось обработать заявку.");
    }
  };

  const handleToggleArtworkVisibility = async (artwork: Artwork) => {
    try {
      if (artwork.isHidden) {
        await adminArtworksApi.show(artwork.id);
      } else {
        await adminArtworksApi.hide(artwork.id);
      }

      await loadData();
    } catch {
      alert("Не удалось изменить видимость работы.");
    }
  };

  const handleCreateExhibition = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateExhibitionRequest = {
      title,
      theme,
      description,
      submissionStartDate,
      submissionEndDate,
      startDate,
      endDate,
    };

    try {
      setCreateError("");
      await exhibitionsApi.create(payload);

      setTitle("");
      setTheme("");
      setDescription("");
      setSubmissionStartDate("");
      setSubmissionEndDate("");
      setStartDate("");
      setEndDate("");

      await loadData();
      alert("Выставка создана.");
    } catch {
      setCreateError("Не удалось создать выставку. Проверь даты и данные.");
    }
  };

  return (
    <section>
      <div className="section-header">
        <h1>Админ-панель</h1>
        <p>Управление выставками, заявками и опубликованными работами.</p>
      </div>

      <section className="section-block">
        <h2>Создать выставку</h2>

        <form className="admin-form" onSubmit={handleCreateExhibition}>
          <input
            type="text"
            placeholder="Название выставки"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Тема выставки"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            required
          />
          <textarea
            placeholder="Описание выставки"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
          />
          <label>
            Начало приёма заявок
            <input
              type="datetime-local"
              value={submissionStartDate}
              onChange={(e) => setSubmissionStartDate(e.target.value)}
              required
            />
          </label>
          <label>
            Конец приёма заявок
            <input
              type="datetime-local"
              value={submissionEndDate}
              onChange={(e) => setSubmissionEndDate(e.target.value)}
              required
            />
          </label>
          <label>
            Начало выставки
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <label>
            Конец выставки
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>

          {createError && <p className="error-text">{createError}</p>}

          <button type="submit">Создать выставку</button>
        </form>
      </section>

      <section className="section-block">
        <h2>Заявки пользователей</h2>

        {loading ? (
          <p>Загрузка заявок...</p>
        ) : submissions.length === 0 ? (
          <p>Заявок пока нет.</p>
        ) : (
          <div className="card-grid">
            {submissions.map((submission) => (
              <article className="card" key={submission.id}>
                <img
                  src={submission.imageUrl}
                  alt={submission.title}
                  className="card-image"
                />
                <div className="card-body">
                  <h3>{submission.title}</h3>
                  <p className="muted">
                    Автор: {submission.userName} ({submission.userEmail})
                  </p>
                  <p className="muted">
                    Выставка: {submission.exhibitionTitle}
                  </p>
                  <p className="muted">Статус: {submission.status}</p>
                  <p>{submission.description}</p>
                  <p className="muted">
                    Отправлено: {formatDate(submission.createdAt)}
                  </p>

                  {submission.adminComment && (
                    <p className="admin-comment">
                      Комментарий: {submission.adminComment}
                    </p>
                  )}

                  <div className="tags">
                    {submission.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {submission.status === "Pending" && (
                    <div className="hero-actions">
                      <button
                        className="approve-button"
                        onClick={() => handleReview(submission.id, true)}
                      >
                        Одобрить
                      </button>
                      <button
                        className="danger-button"
                        onClick={() => handleReview(submission.id, false)}
                      >
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section-block">
        <h2>Опубликованные работы</h2>

        {loading ? (
          <p>Загрузка работ...</p>
        ) : artworks.length === 0 ? (
          <p>Работ пока нет.</p>
        ) : (
          <div className="card-grid">
            {artworks.map((artwork) => (
              <article className="card" key={artwork.id}>
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="card-image"
                />
                <div className="card-body">
                  <h3>{artwork.title}</h3>
                  <p className="muted">
                    Автор: {artwork.authorName} ({artwork.authorEmail})
                  </p>
                  <p className="muted">Выставка: {artwork.exhibitionTitle}</p>
                  <p className="muted">
                    Статус: {artwork.isHidden ? "Скрыта" : "Отображается"}
                  </p>

                  <div className="tags">
                    {artwork.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="hero-actions">
                    <button
                      className={artwork.isHidden ? "approve-button" : "danger-button"}
                      onClick={() => handleToggleArtworkVisibility(artwork)}
                    >
                      {artwork.isHidden ? "Показать" : "Скрыть"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}