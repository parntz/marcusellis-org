/** Default copy + imagery for /media (three fixed destinations from legacy Drupal hub). */
export const DEFAULT_MEDIA_HUB = Object.freeze({
  introTitle: "Everything we publish in one place",
  introHtml:
    "<p>Video features, the photo &amp; video archive, and <em>Nashville Musician</em> magazine — the three pillars of Local 257 media. Pick a door below; each card opens a different corner of the association’s story.</p>",
  panels: {
    featuredVideo: {
      kicker: "Watch",
      title: "Featured video",
      body: "Long-form interviews, explainers, and spotlight pieces — start here when you want sound, picture, and context together.",
      ctaLabel: "Open featured video",
      ctaHref: "/featured-video",
      backgroundImageSrc: "/images/heros/nashville-hero4.jpg",
      backgroundPosition: "center",
    },
    photoGallery: {
      kicker: "Browse",
      title: "Photo & video gallery",
      body: "Performance stills, session candids, and concert footage from the archive — searchable by name, instrument, and keyword.",
      ctaLabel: "Open the gallery",
      ctaHref: "/photo-and-video-gallery",
      backgroundImageSrc: "/images/home-parking-map-bg.jpg",
      backgroundPosition: "right bottom",
    },
    magazine: {
      kicker: "Read",
      title: "Nashville Musician magazine",
      body: "The union’s print voice: industry news, member profiles, and the policy updates that affect your work on the stand and in the studio.",
      ctaLabel: "Open the magazine",
      ctaHref: "/nashville-musician-magazine",
      backgroundImageSrc: "/images/heros/nashville-hero8.jpg",
      backgroundPosition: "center top",
    },
  },
});

export const MEDIA_HUB_PANEL_ORDER = ["featuredVideo", "photoGallery", "magazine"];
