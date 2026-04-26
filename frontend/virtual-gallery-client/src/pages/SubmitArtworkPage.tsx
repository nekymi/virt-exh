import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exhibitionsApi } from "../api/exhibitionsApi";
import { submissionsApi } from "../api/submissionsApi";
import { uploadsApi } from "../api/uploadsApi";
import type { Exhibition } from "../types/exhibition";

export function SubmitArtworkPage() {
  const navigate = useNavigate();

  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [exhibitionId, setExhibitionId] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setPageLoading(true);
        setError("");

        const data = await exhibitionsApi.getAll();
        const allowed = data.filter(
          (item) => item.status === "Приём заявок открыт"
        );

        setExhibitions(allowed);

        if (allowed.length > 0) {
          setExhibitionId(allowed[0].id);
        }
      } catch {
        setError("Не удалось загрузить список выставок.");
      } finally {
        setPageLoading(false);
      }
    };

    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      setError("Выберите изображение.");
      return;
    }

    if (!exhibitionId) {
      setError("Выберите выставку.");
      return;
    }

    try {
      setLoading(true);
      setUploadingImage(true);
      setError("");

      const uploaded = await uploadsApi.uploadImage(imageFile);

      await submissionsApi.create({
        title,
        description,
        year,
        imageUrl: uploaded.url,
        exhibitionId,
        tags: tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      navigate("/profile");
    } catch {
      setError("Не удалось отправить работу.");
    } finally {
      setUploadingImage(false);
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <p>Загрузка формы...</p>;
  }

  return (
    <section className="form-page">
      <form className="auth-form large-form" onSubmit={handleSubmit}>
        <h1>Подача работы</h1>

        {exhibitions.length === 0 ? (
          <p>Сейчас нет выставок с открытым приёмом заявок.</p>
        ) : (
          <>
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

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              required
            />

            <input
              type="text"
              placeholder="Теги через запятую"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />

            {error && <p className="error-text">{error}</p>}

            <button type="submit" disabled={loading || uploadingImage}>
              {uploadingImage
                ? "Загрузка изображения..."
                : loading
                ? "Отправка..."
                : "Отправить заявку"}
            </button>
          </>
        )}
      </form>
    </section>
  );
}