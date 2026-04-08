function isYouTubeUrl(url = "") {
  return /(?:youtube\.com|youtu\.be)/i.test(String(url || ""));
}

function toYouTubeEmbed(url = "") {
  const value = String(url || "").trim();
  const match =
    value.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    value.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    value.match(/embed\/([A-Za-z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}

function isDirectVideo(item) {
  return item.mediaType === "video" && !isYouTubeUrl(item.assetUrl);
}

export function MemberProfileMediaGallery({ items = [] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="member-profile-media">
      <div className="member-panel member-panel--wide">
        <h2 className="panel-title">Media</h2>
        <div className="member-profile-media__grid">
          {items.map((item, index) => {
            const key = item.id || `${item.assetUrl}-${index}`;
            if (item.mediaType === "video" && isYouTubeUrl(item.assetUrl)) {
              const embedUrl = toYouTubeEmbed(item.assetUrl);
              if (!embedUrl) {
                return null;
              }
              return (
                <figure key={key} className="member-profile-media__item member-profile-media__item--video">
                  <div className="member-profile-media__frame">
                    <iframe
                      src={embedUrl}
                      title={item.label || "Member video"}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  {item.label ? <figcaption>{item.label}</figcaption> : null}
                </figure>
              );
            }

            if (isDirectVideo(item)) {
              return (
                <figure key={key} className="member-profile-media__item member-profile-media__item--video">
                  <div className="member-profile-media__frame">
                    <video controls preload="metadata" src={item.assetUrl} />
                  </div>
                  {item.label ? <figcaption>{item.label}</figcaption> : null}
                </figure>
              );
            }

            return (
              <figure key={key} className="member-profile-media__item member-profile-media__item--image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.assetUrl} alt={item.label || "Member image"} loading="lazy" />
                {item.label ? <figcaption>{item.label}</figcaption> : null}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
