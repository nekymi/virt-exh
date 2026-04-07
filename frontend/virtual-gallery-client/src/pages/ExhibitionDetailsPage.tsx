import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { exhibitionsApi } from "../api/exhibitionsApi";
import type { ExhibitionDetails } from "../types/exhibition";
import { formatDate } from "../utils/formatDate";

export function ExhibitionDetailsPage() {
  const { id } = useParams();
  const [exhibition, setExhibition] = useState<ExhibitionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await exhibitionsApi.getById(id);
        setExhibition(data);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return <p>Загрузка выставки...</p>;
  }

  if (!exhibition) {
    return <p>Выставка не найдена.</p>;
  }

  return (
    <section>
      <div className="details-card">
        <p className="eyebrow">{exhibition.theme}</p>
        <h1>{exhibition.title}</h1>
        <p>{exhibition.description}</p>

        <div className="details-grid">
          <div className="info-box">
            <strong>Приём заявок</strong>
            <span>
              {formatDate(exhibition.submissionStartDate)} —{" "}
              {formatDate(exhibition.submissionEndDate)}
            </span>
          </div>
          <div className="info-box">
            <strong>Проведение выставки</strong>
            <span>
              {formatDate(exhibition.startDate)} — {formatDate(exhibition.endDate)}
            </span>
          </div>
          <div className="info-box">
            <strong>Статус</strong>
            <span>{exhibition.status}</span>
          </div>
          <div className="info-box">
            <strong>Количество работ</strong>
            <span>{exhibition.artworkCount}</span>
          </div>
        </div>

        <div className="hero-actions">
          <Link to={`/exhibitions/${exhibition.id}/virtual-room`} className="primary-link">
            Открыть 3D-зал
          </Link>
        </div>
      </div>

      <section className="section-block">
        <h2>Работы выставки</h2>

        {exhibition.artworks.length === 0 ? (
          <p>В этой выставке пока нет опубликованных работ.</p>
        ) : (
          <div className="card-grid">
            {exhibition.artworks.map((artwork) => (
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
    </section>
  );
}