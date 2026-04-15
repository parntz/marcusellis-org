import { getClient } from "../lib/sqlite.mjs";
import { normalizeSitePageRoute } from "../lib/site-pages.js";

const HOME_PAGE_HTML = `
<div class="marcus-home">
  <section class="hero-intro">
    <p class="marcus-tagline">Everyone is welcome here!</p>
    <h1 class="marcus-title">Marcus Ellis</h1>
    <p class="marcus-subtitle">Enjoy the Journey with ME~</p>
    <p class=" spiritual-sign-off">SHALOM</p>
  </section>

  <section class="about-section">
    <h2>About Marcus</h2>
    <p>Marcus Ellis is an advocate for natural health — someone who understands what it means to be given six months to live and survive six years (and counting). His journey has led him to become a:</p>
    <ul>
      <li>National Cancer Coach</li>
      <li>Medical Researcher</li>
      <li>Businessman</li>
      <li>Gourmet Caterer</li>
      <li>Nutritional Coach</li>
      <li>Teacher & Salesman</li>
      <li>Real Estate Broker</li>
      <li>Insurance Agent</li>
      <li>Armed Security Officer</li>
    </ul>
    <p>Marcus speaks on healthcare system issues and shares his story of healing to inspire others facing health challenges.</p>
  </section>

  <section class="facilities-section">
    <h2>Facilities</h2>
    <div class="facility">
      <h3>Ellis Castle</h3>
      <p>A premier catering and event facility located in Texas.</p>
    </div>
    <div class="facility">
      <h3>Tennessee Retreat</h3>
      <p>A serene 200-acre retreat center in Tennessee.</p>
    </div>
  </section>

  <section class="contact-section" id="contact">
    <h2>Contact</h2>
    <p class="contact-quote">"Whosoever is thirsty..."</p>
    <p>Marcus welcomes you to reach out for support, guidance, or simply to connect.</p>
    <div class="contact-info">
      <p><strong>Phone:</strong> <a href="tel:931.722.4949">931.722.4949</a></p>
      <p><strong>Email:</strong> <a href="mailto:ME@marcusellis.org">ME@marcusellis.org</a></p>
    </div>
  </section>

  <section class="work-in-progress">
    <p><em>This site is a work in progress. Thank you for your patience.</em></p>
  </section>
</div>

<style>
.marcus-home {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.hero-intro {
  text-align: center;
  padding: 3rem 0;
  border-bottom: 2px solid var(--line);
  margin-bottom: 2rem;
}

.marcus-tagline {
  font-size: 1.2rem;
  color: var(--accent);
  font-style: italic;
  margin-bottom: 1rem;
}

.marcus-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  color: var(--ink);
  margin: 0.5rem 0;
  line-height: 1.1;
}

.marcus-subtitle {
  font-size: 1.5rem;
  color: var(--muted);
  margin-bottom: 1rem;
}

.spiritual-sign-off {
  font-size: 1.8rem;
  color: var(--accent-dark);
  letter-spacing: 0.3em;
  margin-top: 1rem;
}

.about-section h2,
.facilities-section h2,
.contact-section h2 {
  color: var(--ink);
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.5rem;
  margin: 2rem 0 1.5rem;
}

.about-section ul {
  columns: 2;
  column-gap: 2rem;
  margin: 1.5rem 0;
}

.about-section li {
  break-inside: avoid;
  margin-bottom: 0.5rem;
  color: var(--muted);
}

.facility {
  background: var(--surface);
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid var(--line);
}

.facility h3 {
  color: var(--accent-dark);
  margin-top: 0;
}

.contact-quote {
  font-style: italic;
  font-size: 1.3rem;
  text-align: center;
  color: var(--accent-dark);
  margin: 1.5rem 0;
}

.contact-info {
  background: var(--accent-soft);
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: center;
}

.contact-info a {
  color: var(--accent-dark);
  text-decoration: underline;
}

.work-in-progress {
  text-align: center;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--line);
  color: var(--muted);
}

@media (max-width: 600px) {
  .about-section ul {
    columns: 1;
  }
}
</style>
`;

async function createHomePage() {
  const client = getClient();
  
  const route = "/";
  const normalizedRoute = normalizeSitePageRoute(route);
  
  // Check if page exists
  const existing = await client.execute({
    sql: "SELECT route FROM site_pages WHERE lower(trim(trim(route), '/')) = lower(trim(trim(?), '/')) LIMIT 1",
    args: [normalizedRoute]
  });
  
  if (existing.rows?.length > 0) {
    console.log("Home page exists, updating...");
    const result = await client.execute({
      sql: `
        UPDATE site_pages 
        SET title = ?, meta_description = ?, body_html = ?, summary = ?
        WHERE lower(trim(trim(route), '/')) = lower(trim(trim(?), '/'))
      `,
      args: ["Marcus Ellis", "Natural health advocate, cancer survivor, and wellness coach", HOME_PAGE_HTML, "Home page for Marcus Ellis - natural health advocate and cancer survivor"]
    });
    console.log("Home page updated:", result.rowsAffected);
  } else {
    console.log("Creating new home page...");
    const result = await client.execute({
      sql: `
        INSERT INTO site_pages (route, kind, title, meta_description, body_html, summary)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [route, "mirror-page", "Marcus Ellis", "Natural health advocate, cancer survivor, and wellness coach", HOME_PAGE_HTML, "Home page for Marcus Ellis - natural health advocate and cancer survivor"]
    });
    console.log("Home page created:", result.rowsAffected);
  }
  
  process.exit(0);
}

createHomePage().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
