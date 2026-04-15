import { siteMeta } from "../lib/site-data";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return {
    title: siteMeta.title,
    description: siteMeta.kicker || siteMeta.title,
  };
}

export default async function HomePage() {
  return (
    <div className="page-body-content">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="section-tag">Natural Health Advocate</p>
          <h1>Marcus Ellis</h1>
          <p className="hero-text">
            Health &amp; Financial Resources Advocate, Cancer Survivor
          </p>
        </div>
        <div className="hero-media">
          <div className="media-card">
            <div className="media-card__inner">
              <div className="seal-card">
                <div className="seal-card__inner">
                  <p className="seal-card__name">Marcus Ellis</p>
                  <p className="seal-card__title">Natural Health Advocate</p>
                  <p className="seal-card__subtitle">Cancer Survivor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section content-section--intro">
        <div className="content-section__inner">
          <h2>About Marcus</h2>
          <p>
            Marcus Ellis is a natural health advocate and cancer survivor dedicated
            to helping others navigate health challenges and access quality
            resources for living well.
          </p>
          <p>
            Through personal experience and deep research, Marcus shares what
            works — grounded in real-world results, not trends.
          </p>
        </div>
      </section>

      <section className="content-section content-section--focus">
        <div className="content-section__inner">
          <h2>Areas of Focus</h2>
          <div className="focus-grid">
            <div className="focus-card">
              <h3>Natural Health</h3>
              <p>
                Exploring evidence-informed natural approaches to wellness,
                prevention, and recovery.
              </p>
            </div>
            <div className="focus-card">
              <h3>Cancer Recovery</h3>
              <p>
                Navigating life after cancer with practical resources, community
                connections, and hope.
              </p>
            </div>
            <div className="focus-card">
              <h3>Financial Resources</h3>
              <p>
                Finding and sharing financial tools and guidance that support
                health and long-term wellbeing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section content-section--contact">
        <div className="content-section__inner">
          <h2>Get in Touch</h2>
          <p>
            Have a question or want to connect?{" "}
            <a href="/contact/">Reach out</a> — responses are typically within
            a few days.
          </p>
        </div>
      </section>
    </div>
  );
}
