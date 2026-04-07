import type { VirtualRoomArtwork } from "../../types/virtualRoom";

interface ArtworkModalProps {
  artwork: VirtualRoomArtwork | null;
  onClose: () => void;
}

export function ArtworkModal({ artwork, onClose }: ArtworkModalProps) {
  if (!artwork) {
    return null;
  }

  return (
    <div className="artwork-modal-backdrop" onClick={onClose}>
      <div
        className="artwork-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="artwork-modal-close" onClick={onClose}>
          ×
        </button>

        <div className="artwork-modal-grid">
          <div className="artwork-modal-image-wrap">
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="artwork-modal-image"
            />
          </div>

          <div className="artwork-modal-content">
            <p className="eyebrow">Картина выставки</p>
            <h2>{artwork.title}</h2>
            <p>{artwork.description}</p>

            <div className="artwork-modal-meta">
              <div>
                <strong>Автор</strong>
                <span>{artwork.authorName}</span>
              </div>
              <div>
                <strong>Email</strong>
                <span>{artwork.authorEmail}</span>
              </div>
              <div>
                <strong>Год</strong>
                <span>{artwork.year}</span>
              </div>
            </div>

            <div className="tags">
              {artwork.tags.map((tag) => (
                <span className="tag" key={tag}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}