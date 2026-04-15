import { siteMeta } from "../../lib/site-data";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return {
    title: `Contact | ${siteMeta.title}`,
    description: "Get in touch with Marcus Ellis.",
  };
}

export default function ContactPage() {
  return (
    <div className="page-body-content">
      <section className="content-section">
        <div className="content-section__inner">
          <h1>Get in Touch</h1>
          <p>
            Have a question or want to connect? Send a message below and
            {" "}{siteMeta.title} will get back to you.
          </p>
          <p>
            Responses are typically within a few days.
          </p>
          <div className="contact-form-block">
            <p><em>Contact form coming soon.</em></p>
            <p>
              In the meantime, feel free to reach out via any of the channels
              listed on the main site.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
