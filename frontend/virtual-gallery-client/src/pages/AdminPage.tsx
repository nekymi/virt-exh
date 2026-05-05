import { useCallback, useEffect, useState } from "react";
import { adminArtworksApi } from "../api/adminArtworksApi";
import {
  exhibitionsApi,
  type CreateExhibitionRequest,
} from "../api/exhibitionsApi";
import { submissionsApi } from "../api/submissionsApi";
import type { Artwork } from "../types/artwork";
import type { Submission } from "../types/submission";
import type { Exhibition } from "../types/exhibition";
import { formatDate } from "../utils/formatDate";

function getExhibitionStatusLabel(status?: string) {
  if (!status) {
    return "Статус не указан";
  }

  if (status === "Open" || status === "Active" || status === "Приём заявок открыт") {
    return "Приём заявок открыт";
  }

  if (status === "Closed" || status === "Finished") {
    return "Завершена";
  }

  if (status === "Draft" || status === "Upcoming") {
    return "Запланирована";
  }

  return status;
}

function getExhibitionStatusClass(status?: string) {
  if (status === "Closed" || status === "Finished") {
    return "status-closed";
  }

  if (status === "Draft" || status === "Upcoming") {
    return "status-draft";
  }

  return "";
}

export function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [description, setDescription] = useState("");
  const [submissionStartDate, setSubmissionStartDate] = useState("");
  const [submissionEndDate, setSubmissionEndDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [createError, setCreateError] = useState("");

  const [editingExhibitionId, setEditingExhibitionId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editTheme, setEditTheme] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSubmissionStartDate, setEditSubmissionStartDate] = useState("");
  const [editSubmissionEndDate, setEditSubmissionEndDate] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editError, setEditError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [submissionsData, artworksData, exhibitionsData] = await Promise.all([
        submissionsApi.getAll(),
        adminArtworksApi.getAll(),
        exhibitionsApi.getAll(),
      ]);

      setSubmissions(submissionsData);
      setArtworks(artworksData);
      setExhibitions(exhibitionsData);
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
        ? "Комментарий администратора, если он нужен:"
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
      setCreateError("Не удалось создать выставку. Проверь даты и заполненные поля.");
    }
  };

  const startEditExhibition = (exhibition: Exhibition) => {
    setEditingExhibitionId(exhibition.id);
    setEditTitle(exhibition.title);
    setEditTheme(exhibition.theme);
    setEditDescription(exhibition.description);
    setEditSubmissionStartDate(exhibition.submissionStartDate.slice(0, 16));
    setEditSubmissionEndDate(exhibition.submissionEndDate.slice(0, 16));
    setEditStartDate(exhibition.startDate.slice(0, 16));
    setEditEndDate(exhibition.endDate.slice(0, 16));
    setEditError("");
  };

  const cancelEditExhibition = () => {
    setEditingExhibitionId("");
    setEditTitle("");
    setEditTheme("");
    setEditDescription("");
    setEditSubmissionStartDate("");
    setEditSubmissionEndDate("");
    setEditStartDate("");
    setEditEndDate("");
    setEditError("");
  };

  const handleUpdateExhibition = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingExhibitionId) {
      setEditError("Сначала выбери выставку для редактирования.");
      return;
    }

    const payload: CreateExhibitionRequest = {
      title: editTitle,
      theme: editTheme,
      description: editDescription,
      submissionStartDate: editSubmissionStartDate,
      submissionEndDate: editSubmissionEndDate,
      startDate: editStartDate,
      endDate: editEndDate,
    };

    try {
      setEditError("");

      await exhibitionsApi.update(editingExhibitionId, payload);
      await loadData();

      alert("Выставка обновлена.");
    } catch {
      setEditError("Не удалось обновить выставку.");
    }
  };

  return (
    <section className="page-section admin-page">
      <div className="admin-page-header">
        <h1>Админ-панель</h1>
        <p>Управление выставками, заявками участников и опубликованными работами.</p>
      </div>

      <section className="section-block">
        <h2>Создать выставку</h2>

        <form className="auth-form large-form" onSubmit={handleCreateExhibition}>
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
        <h2>Редактировать выставку</h2>

        {exhibitions.length === 0 ? (
          <p className="muted">Выставок пока нет.</p>
        ) : (
          <div className="admin-exhibitions-list">
            {exhibitions.map((exhibition) => (
              <article className="admin-exhibition-card" key={exhibition.id}>
                <h3 className="admin-exhibition-card-title">
                  {exhibition.title}
                </h3>

                <p className="admin-exhibition-card-theme">
                  {exhibition.theme}
                </p>

                <p className="admin-exhibition-card-description">
                  {exhibition.description}
                </p>

                <div className="admin-exhibition-card-footer">
                  <span
                    className={`admin-exhibition-status ${getExhibitionStatusClass(
                      exhibition.status
                    )}`}
                  >
                    {getExhibitionStatusLabel(exhibition.status)}
                  </span>

                  <div className="admin-exhibition-actions">
                    <button
                      type="button"
                      className="admin-edit-button"
                      onClick={() => startEditExhibition(exhibition)}
                    >
                      Редактировать
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {editingExhibitionId && (
          <form className="auth-form large-form" onSubmit={handleUpdateExhibition}>
            <h2>Изменение выставки</h2>

            <input
              type="text"
              placeholder="Название выставки"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Тема выставки"
              value={editTheme}
              onChange={(e) => setEditTheme(e.target.value)}
              required
            />

            <textarea
              placeholder="Описание выставки"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              required
              rows={4}
            />

            <label>
              Начало приёма заявок
              <input
                type="datetime-local"
                value={editSubmissionStartDate}
                onChange={(e) => setEditSubmissionStartDate(e.target.value)}
                required
              />
            </label>

            <label>
              Конец приёма заявок
              <input
                type="datetime-local"
                value={editSubmissionEndDate}
                onChange={(e) => setEditSubmissionEndDate(e.target.value)}
                required
              />
            </label>

            <label>
              Начало выставки
              <input
                type="datetime-local"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                required
              />
            </label>

            <label>
              Конец выставки
              <input
                type="datetime-local"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                required
              />
            </label>

            {editError && <p className="error-text">{editError}</p>}

            <div className="hero-actions">
              <button type="submit">Сохранить изменения</button>

              <button
                type="button"
                className="admin-secondary-button"
                onClick={cancelEditExhibition}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="section-block">
        <h2>Заявки пользователей</h2>

        {loading ? (
          <p className="muted">Загрузка заявок...</p>
        ) : submissions.length === 0 ? (
          <p className="muted">Заявок пока нет.</p>
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
                        type="button"
                        className="approve-button"
                        onClick={() => handleReview(submission.id, true)}
                      >
                        Одобрить
                      </button>

                      <button
                        type="button"
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
          <p className="muted">Загрузка работ...</p>
        ) : artworks.length === 0 ? (
          <p className="muted">Работ пока нет.</p>
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
                      type="button"
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