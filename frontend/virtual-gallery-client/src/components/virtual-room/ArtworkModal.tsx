import { useEffect, useMemo, useState } from "react";
import type { VirtualRoomArtwork } from "../../types/virtualRoom";

interface ArtworkModalProps {
  artwork: VirtualRoomArtwork | null;
  onClose: () => void;
}

type Orientation = "portrait" | "landscape" | "square";

const API_ORIGIN = "http://localhost:5215";

function normalizeImageUrl(imageUrl: string): string {
  if (!imageUrl) {
    return "";
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/")) {
    return `${API_ORIGIN}${imageUrl}`;
  }

  return `${API_ORIGIN}/${imageUrl}`;
}

function getOrientation(width: number, height: number): Orientation {
  if (!width || !height) {
    return "landscape";
  }

  const ratio = width / height;

  if (ratio > 1.08) {
    return "landscape";
  }

  if (ratio < 0.92) {
    return "portrait";
  }

  return "square";
}

function getModalGridColumns(orientation: Orientation): string {
  if (orientation === "portrait") {
    return "minmax(280px, 0.85fr) minmax(320px, 1.15fr)";
  }

  if (orientation === "landscape") {
    return "minmax(420px, 1.2fr) minmax(320px, 0.9fr)";
  }

  return "minmax(340px, 1fr) minmax(320px, 1fr)";
}

function getImageAreaHeight(orientation: Orientation): string {
  if (orientation === "portrait") {
    return "72vh";
  }

  if (orientation === "landscape") {
    return "62vh";
  }

  return "66vh";
}

function getOrientationLabel(orientation: Orientation): string {
  if (orientation === "portrait") {
    return "Вертикальная";
  }

  if (orientation === "landscape") {
    return "Горизонтальная";
  }

  return "Квадратная";
}

export function ArtworkModal({ artwork, onClose }: ArtworkModalProps) {
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  const finalImageUrl = useMemo(
    () => normalizeImageUrl(artwork?.imageUrl ?? ""),
    [artwork?.imageUrl]
  );

  const orientation = useMemo(
    () => getOrientation(imageWidth, imageHeight),
    [imageWidth, imageHeight]
  );

  useEffect(() => {
    const updateScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 900);
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);

    return () => {
      window.removeEventListener("resize", updateScreenSize);
    };
  }, []);

  useEffect(() => {
    if (!artwork) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [artwork, onClose]);

  useEffect(() => {
    setImageLoaded(false);
    setImageWidth(0);
    setImageHeight(0);
  }, [artwork?.id]);

  if (!artwork) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(8px)",
        boxSizing: "border-box",
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: "min(1240px, 100%)",
          maxHeight: "90vh",
          display: "grid",
          gridTemplateColumns: isLargeScreen
            ? getModalGridColumns(orientation)
            : "1fr",
          overflow: "hidden",
          borderRadius: "28px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          background:
            "linear-gradient(135deg, rgba(20, 21, 29, 0.98), rgba(13, 14, 20, 0.98))",
          boxShadow: "0 28px 90px rgba(0, 0, 0, 0.65)",
          boxSizing: "border-box",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            zIndex: 2,
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            background: "rgba(255, 255, 255, 0.08)",
            color: "#ffffff",
            fontSize: "34px",
            lineHeight: "46px",
            fontWeight: 300,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div
          style={{
            padding: isLargeScreen ? "30px" : "20px",
            borderRight: isLargeScreen
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "none",
            borderBottom: isLargeScreen
              ? "none"
              : "1px solid rgba(255, 255, 255, 0.1)",
            background:
              "radial-gradient(circle at 20% 10%, rgba(133, 78, 255, 0.24), transparent 34%), #0d0f15",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px",
              paddingRight: "60px",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "28px",
                padding: "6px 12px",
                borderRadius: "999px",
                border: "1px solid rgba(157, 132, 255, 0.35)",
                background: "rgba(157, 132, 255, 0.12)",
                color: "#b9a8ff",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              Картина выставки
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "28px",
                padding: "6px 12px",
                borderRadius: "999px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                background: "rgba(255, 255, 255, 0.06)",
                color: "rgba(255, 255, 255, 0.72)",
                fontSize: "13px",
              }}
            >
              {getOrientationLabel(orientation)}
            </span>

            {imageLoaded && imageWidth > 0 && imageHeight > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "28px",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.72)",
                  fontSize: "13px",
                }}
              >
                {imageWidth} × {imageHeight}
              </span>
            )}
          </div>

          <div
            style={{
              position: "relative",
              height: isLargeScreen ? getImageAreaHeight(orientation) : "44vh",
              minHeight: "300px",
              maxHeight: "680px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              padding: "24px",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              background:
                "radial-gradient(circle at 50% 20%, rgba(120, 76, 255, 0.32), rgba(12, 13, 18, 0.98) 56%)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "260px",
                height: "260px",
                left: "-90px",
                top: "20px",
                borderRadius: "50%",
                background: "rgba(145, 80, 255, 0.28)",
                filter: "blur(60px)",
              }}
            />

            <div
              style={{
                position: "absolute",
                width: "240px",
                height: "240px",
                right: "-80px",
                bottom: "-60px",
                borderRadius: "50%",
                background: "rgba(196, 130, 255, 0.18)",
                filter: "blur(70px)",
              }}
            />

            {finalImageUrl ? (
              <img
                src={finalImageUrl}
                alt={artwork.title}
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "18px",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  background: "#ffffff",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
                }}
                onLoad={(event) => {
                  setImageLoaded(true);
                  setImageWidth(event.currentTarget.naturalWidth);
                  setImageHeight(event.currentTarget.naturalHeight);
                }}
                onError={() => {
                  setImageLoaded(false);
                  setImageWidth(0);
                  setImageHeight(0);
                }}
              />
            ) : (
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "18px",
                  border: "1px dashed rgba(255, 255, 255, 0.18)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "rgba(255, 255, 255, 0.55)",
                  fontSize: "18px",
                }}
              >
                Изображение отсутствует
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            maxHeight: isLargeScreen ? "90vh" : "46vh",
            overflowY: "auto",
            padding: isLargeScreen ? "44px 36px 36px" : "24px 20px 28px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              marginBottom: "12px",
              color: "#a892ff",
              fontSize: "14px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.22em",
            }}
          >
            Картина выставки
          </div>

          <h2
            style={{
              margin: "0 0 18px",
              paddingRight: "56px",
              color: "#ffffff",
              fontSize: isLargeScreen ? "38px" : "30px",
              lineHeight: 1.08,
              fontWeight: 900,
              wordBreak: "break-word",
            }}
          >
            {artwork.title}
          </h2>

          <p
            style={{
              margin: "0 0 28px",
              color: "rgba(255, 255, 255, 0.76)",
              fontSize: "18px",
              lineHeight: 1.65,
              whiteSpace: "pre-line",
            }}
          >
            {artwork.description || "Описание не указано."}
          </p>

          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            <InfoCard title="Автор" value={artwork.authorName} />
            <InfoCard title="Email" value={artwork.authorEmail} breakValue />
            <InfoCard title="Год" value={String(artwork.year)} />

            <div
              style={{
                padding: "18px",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.045)",
              }}
            >
              <div
                style={{
                  marginBottom: "12px",
                  color: "#ffffff",
                  fontSize: "21px",
                  fontWeight: 800,
                }}
              >
                Теги
              </div>

              {artwork.tags.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {artwork.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: "inline-flex",
                        padding: "7px 12px",
                        borderRadius: "999px",
                        border: "1px solid rgba(157, 132, 255, 0.28)",
                        background: "rgba(157, 132, 255, 0.1)",
                        color: "#c9bdff",
                        fontSize: "14px",
                        fontWeight: 600,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    color: "rgba(255, 255, 255, 0.55)",
                    fontSize: "16px",
                  }}
                >
                  Теги не указаны
                </div>
              )}
            </div>

            {imageLoaded && imageWidth > 0 && imageHeight > 0 && (
              <div
                style={{
                  padding: "18px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.045)",
                }}
              >
                <div
                  style={{
                    marginBottom: "12px",
                    color: "#ffffff",
                    fontSize: "21px",
                    fontWeight: 800,
                  }}
                >
                  Параметры изображения
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isLargeScreen
                      ? "repeat(3, minmax(0, 1fr))"
                      : "1fr",
                    gap: "10px",
                  }}
                >
                  <SmallStat title="Ширина" value={`${imageWidth}px`} />
                  <SmallStat title="Высота" value={`${imageHeight}px`} />
                  <SmallStat title="Формат" value={getOrientationLabel(orientation)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
  breakValue = false,
}: {
  title: string;
  value: string;
  breakValue?: boolean;
}) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "20px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        background: "rgba(255, 255, 255, 0.045)",
      }}
    >
      <div
        style={{
          marginBottom: "8px",
          color: "#ffffff",
          fontSize: "21px",
          fontWeight: 800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "rgba(255, 255, 255, 0.68)",
          fontSize: "22px",
          lineHeight: 1.35,
          wordBreak: breakValue ? "break-all" : "normal",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SmallStat({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "14px",
        background: "rgba(0, 0, 0, 0.22)",
      }}
    >
      <div
        style={{
          marginBottom: "5px",
          color: "rgba(255, 255, 255, 0.48)",
          fontSize: "13px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#ffffff",
          fontSize: "18px",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}