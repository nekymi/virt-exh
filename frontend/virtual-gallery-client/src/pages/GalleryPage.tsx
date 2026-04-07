import { useCallback, useEffect, useState } from "react";
import { artworksApi } from "../api/artworksApi";
import type { Artwork } from "../types/artwork";
import { formatDate } from "../utils/formatDate";

export function GalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);

  const loadArtworks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await artworksApi.getAll({
        search: search || undefined,
        author: author || undefined,
        tag: tag || undefined,
      });
      setArtworks(data);
    } finally {
      setLoading(false);
    }
  }, [search, author, tag]);

  useEffect(() => {
    void loadArtworks();
  }, [loadArtworks]);

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadArtworks();
  };

  return (
    <section>
      <div className="section-header">
        <h1>Галерея работ</h1>
        <p>Поиск и фильтрация опубликованных работ.</p>
      </div>

      <form className="filters" onSubmit={handleFilter}>
        <input
          type="text"
          placeholder="Поиск по названию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Фильтр по автору"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <input
          type="text"
          placeholder="Фильтр по тегу"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <button type="submit">Применить</button>
      </form>

      {loading ? (
        <p>Загрузка работ...</p>
      ) : artworks.length === 0 ? (
        <p>Работы пока не найдены.</p>
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
                  {artwork.authorName} · {artwork.year}
                </p>
                <p>{artwork.description}</p>
                <p className="muted">Выставка: {artwork.exhibitionTitle}</p>
                <p className="muted">
                  Дата публикации: {formatDate(artwork.createdAt)}
                </p>

                <div className="tags">
                  {artwork.tags.map((item) => (
                    <span className="tag" key={item}>
                      #{item}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}