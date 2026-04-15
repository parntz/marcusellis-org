import { siteMeta } from "../../lib/site-data";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return {
    title: `About | ${siteMeta.title}`,
    description: "Learn more about Marcus Ellis, natural health advocate and cancer survivor.",
  };
}

export default function AboutPage() {
  return (
    <div className="page-body-content">
      <section className="content-section">
        <div className="content-section__inner">
          <h1>About Marcus Ellis</h1>
          <p>
            Marcus Ellis is a natural health advocate and cancer survivor whose
            mission is to help others navigate health challenges with practical,
            evidence-informed resources.
          </p>
          <p>
            After his own experience with cancer, Marcus became dedicated to
            exploring what truly works — from nutrition and movement to community
            support and financial resilience.
          </p>
          <p>
            He shares his findings openly, believing that access to good
            information should not depend on who you know or how much you can pay.
          </p>
        </div>
      </section>
    </div>
  );
}
