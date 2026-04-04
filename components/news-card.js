import Image from "next/image";
import Link from "next/link";

export function NewsCard({ item }) {
  return (
    <article className="news-card">
      <div className="news-image-wrap">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="(max-width: 700px) 100vw, 30vw"
          className="news-image"
        />
      </div>
      <div className="news-copy">
        <p className="feature-eyebrow">{item.date}</p>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <Link href={`/news/${item.slug}/`} className="text-link">
          View &gt;&gt;
        </Link>
      </div>
    </article>
  );
}
