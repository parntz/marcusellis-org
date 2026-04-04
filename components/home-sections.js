import Link from "next/link";
import Image from "next/image";

export function HomeSections({ items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="content-block home-sections-block">
      <div className="section-heading">
        <p className="section-tag">From The Original Site</p>
        <h2>Homepage sections rebuilt from the mirrored source.</h2>
      </div>
      <div className="home-sections-grid">
        {items.map((item) => (
          <article key={item.title} className="home-section-card">
            {item.image ? (
              <div className="home-section-image-wrap">
                <Image
                  src={item.image}
                  alt={item.title}
                  className="home-section-image"
                  width={640}
                  height={360}
                  sizes="(max-width: 600px) 100vw, 50vw"
                />
              </div>
            ) : null}
            <div className="home-section-copy">
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              {item.href ? (
                <Link href={item.href} className="text-link">
                  View &gt;&gt;
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
