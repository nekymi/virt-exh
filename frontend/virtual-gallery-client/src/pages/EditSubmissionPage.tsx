import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { exhibitionsApi } from "../api/exhibitionsApi";
import { submissionsApi } from "../api/submissionsApi";
import { uploadsApi } from "../api/uploadsApi";
import type { Exhibition } from "../types/exhibition";
import type { Submission } from "../types/submission";

export function EditSubmissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [exhibitionId, setExhibitionId] = useState("");
  const [tags, setTags] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setPageLoading(true);
        setError("");

        const [submissionData, exhibitionsData] = await Promise.all([
          submissionsApi.getById(id),
          exhibitionsApi.getAll(),
        ]);

        if (submissionData.status !== "Pending") {
          setError("Редактировать можно только заявку со статусом Pending.");
          return;
        }

        const allowed = exhibitionsData.filter(
          (item) => item.status === "Приём заявок открыт"
        );

        setSubmission(submissionData);
        setExhibitions(allowed);

        setTitle(submissionData.title);
        setDescription(submissionData.description);
        setYear(submissionData.year);
        setImageUrl(submissionData.imageUrl);
        setTags(submissionData.tags.join(", "));

        const matchedExhibition = allowed.find(
          (item) => item.title === submissionData.exhibitionTitle
        );

        if (matchedExhibition) {
          setExhibitionId(matchedExhibition.id);
        } else if (allowed.length > 0) {
          setExhibitionId(allowed[0].id);
        }
      } catch {
        setError("Не удалось загрузить заявку.");
      } finally {
        setPageLoading(false);
      }
    };

    void load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      setLoading(true);
      setError("");

      let finalImageUrl = imageUrl;

      if (imageFile) {
        const uploaded = await uploadsApi.uploadImage(imageFile);
        finalImageUrl = uploaded.url;
      }

      await submissionsApi.update(id, {
        title,
        description,
        year,
        imageUrl: finalImageUrl,
        exhibitionId,
        tags: tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      navigate("/profile");
    } catch {
      setError("Не удалось сохранить изменения.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <p>Загрузка заявки...</p>;
  }

  if (!submission) {
    return <p>Заявка не найдена.</p>;
  }

  return (
    <section className="form-page">
      <form className="auth-form large-form" onSubmit={handleSubmit}>
        <h1>Редактирование заявки</h1>

        <select
          value={exhibitionId}
          onChange={(e) => setExhibitionId(e.target.value)}
          required
          className="app-select"
        >
          {exhibitions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title} — {item.theme}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Название работы"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Описание работы"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
        />

        <input
          type="number"
          placeholder="Год создания"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          required
        />

        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            style={{ maxWidth: "240px", borderRadius: "12px" }}
          />
        )}

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />

        <input
          type="text"
          placeholder="Теги через запятую"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Сохранение..." : "Сохранить изменения"}
        </button>
      </form>
    </section>
  );
}