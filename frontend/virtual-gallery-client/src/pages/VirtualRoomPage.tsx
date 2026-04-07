import { useEffect, useState } from "react";
import { exhibitionsApi } from "../api/exhibitionsApi";
import { ArtworkModal } from "../components/virtual-room/ArtworkModal";
import { VirtualGalleryScene } from "../components/virtual-room/VirtualGalleryScene";
import type { VirtualRoomArtwork, VirtualRoomData } from "../types/virtualRoom";
import { useParams } from "react-router-dom";

export function VirtualRoomPage() {
  const { id } = useParams();
  const [data, setData] = useState<VirtualRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState<VirtualRoomArtwork | null>(null);
  const [hoveredArtwork, setHoveredArtwork] = useState<VirtualRoomArtwork | null>(null);

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

  if (loading) {
    return <p>Загрузка 3D-зала...</p>;
  }

  if (!data) {
    return <p>Данные 3D-зала не найдены.</p>;
  }

  return (
    <section className="virtual-room-page">
      <div className="details-card">
        <p className="eyebrow">Virtual Room</p>
        <h1>{data.exhibitionTitle}</h1>
        <p>{data.exhibitionDescription}</p>
        <p className="muted">Тема: {data.exhibitionTheme}</p>
        <p className="muted">Статус: {data.status}</p>
        <p className="muted">
          В зале отображается {data.artworks.length} из {data.maxArtworks} работ
        </p>
      </div>

      <div className="virtual-room-header-hint">
        <span>WASD — движение</span>
        <span>← → — поворот</span>
        <span>Наведи или кликни по картине</span>
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
          onArtworkSelect={setSelectedArtwork}
          onArtworkHover={setHoveredArtwork}
        />
      </div>

      <ArtworkModal
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
      />
    </section>
  );
}