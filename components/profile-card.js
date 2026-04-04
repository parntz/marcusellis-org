import Image from "next/image";
import Link from "next/link";

export function ProfileCard({ item }) {
  return (
    <article className="profile-card">
      <div className="profile-media">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 700px) 100vw, 30vw"
          className="profile-image"
        />
      </div>
      <div className="profile-copy">
        {item.discipline ? <p className="feature-eyebrow">{item.discipline}</p> : null}
        <h3>{item.name}</h3>
        <p>{item.summary}</p>
        <Link href={`/artists/${item.slug}/`} className="text-link">
          View &gt;&gt;
        </Link>
      </div>
    </article>
  );
}
