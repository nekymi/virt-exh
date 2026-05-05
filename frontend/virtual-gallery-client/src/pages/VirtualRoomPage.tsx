import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { exhibitionsApi } from "../api/exhibitionsApi";
import { ArtworkModal } from "../components/virtual-room/ArtworkModal";
import { VirtualGalleryScene } from "../components/virtual-room/VirtualGalleryScene";
import type { VirtualRoomArtwork, VirtualRoomData } from "../types/virtualRoom";

function getStatusLabel(status: string): string {
  if (!status) {
    return "Статус не указан";
  }

  if (status === "Open" || status === "Active") {
    return "Приём заявок открыт";
  }

  if (status === "Closed" || status === "Finished") {
    return "Выставка завершена";
  }

  if (status === "Upcoming" || status === "Draft") {
    return "Выставка запланирована";
  }

  return status;
}

export function VirtualRoomPage() {
  const { id } = useParams();

  const [data, setData] = useState<VirtualRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] =
    useState<VirtualRoomArtwork | null>(null);
  const [hoveredArtwork, setHoveredArtwork] =
    useState<VirtualRoomArtwork | null>(null);
  const [cameraResetKey, setCameraResetKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await exhibitionsApi.getVirtualRoom(id);
        setData(response);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const handleCloseArtworkModal = () => {
    setSelectedArtwork(null);
    setCameraResetKey((current) => current + 1);
  };

  if (loading) {
    return (
      <section className="virtual-room-page">
        <div className="exhibitions-state-card">
          <div className="loader-dot" />
          <h2>Загружаем 3D-зал</h2>
          <p>Подготавливаем виртуальное пространство и размещаем работы на стенах.</p>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="virtual-room-page">
        <div className="exhibitions-state-card error">
          <h2>3D-зал не найден</h2>
          <p>Не удалось получить данные выставки. Проверь, существует ли эта экспозиция.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="virtual-room-page">
      <div className="details-card">
        <p className="eyebrow">3D-зал выставки</p>

        <h1>{data.exhibitionTitle}</h1>

        <p>{data.exhibitionDescription}</p>

        <div className="details-grid">
          <div className="info-box">
            <strong>Тема</strong>
            <span>{data.exhibitionTheme}</span>
          </div>

          <div className="info-box">
            <strong>Статус</strong>
            <span>{getStatusLabel(data.status)}</span>
          </div>

          <div className="info-box">
            <strong>Работы в зале</strong>
            <span>
              {data.artworks.length} из {data.maxArtworks}
            </span>
          </div>

          <div className="info-box">
            <strong>Навигация</strong>
            <span>WASD и стрелки клавиатуры</span>
          </div>
        </div>
      </div>

      <div className="virtual-room-header-hint">
        <span>WASD — движение</span>
        <span>← → — поворот</span>
        <span>Клик по картине — приблизиться и открыть</span>
      </div>

      {hoveredArtwork && (
        <div className="floating-hover-card">
          <strong>{hoveredArtwork.title}</strong>
          <span>{hoveredArtwork.authorName}</span>
        </div>
      )}

      <div className="section-block">
        <VirtualGalleryScene
          artworks={data.artworks}
          cameraResetKey={cameraResetKey}
          onArtworkSelect={setSelectedArtwork}
          onArtworkHover={setHoveredArtwork}
        />
      </div>

      <ArtworkModal
        artwork={selectedArtwork}
        onClose={handleCloseArtworkModal}
      />
    </section>
  );
}