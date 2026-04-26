import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { submissionsApi } from "../api/submissionsApi";
import type { Submission } from "../types/submission";
import { formatDate } from "../utils/formatDate";
import { useAuth } from "../contexts/useAuth";

export function ProfilePage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await submissionsApi.getMy();
      setSubmissions(data);
    } catch {
      setError("Не удалось загрузить ваши заявки.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Удалить эту заявку?");
    if (!confirmed) return;

    try {
      await submissionsApi.delete(id);
      await loadSubmissions();
    } catch {
      alert("Не удалось удалить заявку.");
    }
  };

  return (
    <section className="page-section">
      <div className="section-heading">
        <h1>Личный кабинет</h1>
        <p>
          <strong>{user?.name}</strong>
          <br />
          {user?.email}
        </p>
      </div>

      <div className="hero-actions">
        <Link to="/submit" className="nav-link">
          Подать новую работу
        </Link>
      </div>

      <section className="section-block">
        <h2>Мои заявки</h2>

        {loading ? (
          <p>Загрузка заявок...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : submissions.length === 0 ? (
          <p>У вас пока нет заявок.</p>
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
                  <p className="muted">Выставка: {submission.exhibitionTitle}</p>
                  <p className="muted">Статус: {submission.status}</p>
                  <p>{submission.description}</p>
                  <p className="muted">
                    Отправлено: {formatDate(submission.createdAt)}
                  </p>

                  {submission.adminComment && (
                    <p className="admin-comment">
                      Комментарий администратора: {submission.adminComment}
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
                      <Link
                        to={`/submissions/${submission.id}/edit`}
                        className="approve-button"
                      >
                        Редактировать
                      </Link>

                      <button
                        className="danger-button"
                        onClick={() => handleDelete(submission.id)}
                      >
                        Удалить заявку
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}