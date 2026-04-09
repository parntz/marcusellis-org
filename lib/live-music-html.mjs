import { extractDrupalContentEncodedHtml } from "./drupal-html-clean.js";
import { rewriteLegacyNashvilleSiteInHtml } from "./legacy-site-url.js";

export const LIVE_MUSIC_ROUTE = "/live-music";

export const LIVE_MUSIC_CANONICAL_SOURCE_HTML = `
<div class="live-music-article">
  <div class="live-music-hub__lead live-music-preface">
    <p>
      Nashville is home to some of the greatest live music on earth. Our members &ldquo;play out&rdquo;
      every night of the week, and this is the place to find them, whether you are a local looking for
      something new or a tourist looking for that &ldquo;Nashville Moment&rdquo; and everything in
      between.
    </p>
  </div>
  <div class="live-music-newspaper">
    <p>
      On any given night, stages across Middle Tennessee light up with <strong>hundreds of bands and
      solo artists</strong> union professionals, house bands, pick-up groups, and touring acts passing
      through. From early sets to last call, downtown corridors, neighborhood clubs, listening rooms,
      churches, festivals, and private rooms keep the city humming with drums, steel, horns, and
      voices that have traveled here from every corner of the map.
    </p>
    <p>
      The scene is <strong>dense, diverse, and relentless in the best way</strong>: country and
      Americana are part of the story the world knows, but rock, soul, jazz, gospel, funk, bluegrass,
      Latin music, and songwriter nights share the calendar night after night. Local 257 members are on
      the posters, in the pit orchestras, on Broadway, in East Nashville rooms, and on the festival
      fields that draw fans from around the globe.
    </p>
    <p>
      That energy is what makes Nashville more than a postcard it is a <strong>working music town</strong>
      where audiences expect craft, show after show. Whether you are mapping a weekend of venues,
      chasing a new favorite artist, or hiring the right group for your room, you are stepping into one
      of the deepest live-music ecosystems anywhere.
    </p>
    <p>
      <strong>Explore what is playing.</strong> Use the listings and resources on this site to follow
      calendars, discover acts, and connect with members who make their living on stage because in
      Nashville, the show is almost always already going on, and there is another room worth walking
      into tonight.
    </p>
  </div>
</div>
`.trim();

export function getLiveMusicSourceFromPageBody(bodyHtml) {
  const raw = String(bodyHtml || "").trim();
  if (!raw) return LIVE_MUSIC_CANONICAL_SOURCE_HTML;

  const extracted = extractDrupalContentEncodedHtml(raw).trim();
  return rewriteLegacyNashvilleSiteInHtml(extracted || raw);
}

export function getLiveMusicDisplayHtmlFromSource(sourceHtml) {
  return rewriteLegacyNashvilleSiteInHtml(
    String(sourceHtml || "").trim() || LIVE_MUSIC_CANONICAL_SOURCE_HTML
  );
}
