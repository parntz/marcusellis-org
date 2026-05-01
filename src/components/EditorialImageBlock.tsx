import type { PublicAsset } from "@/lib/assets";
import { PublicImage } from "./PublicImage";

export function EditorialImageBlock({ image, caption }: { image: PublicAsset; caption: string }) {
  return (
    <figure className="my-12">
      <div className="relative aspect-[16/9] overflow-hidden rounded-[2rem] border border-ivory/10">
        <PublicImage asset={image} fill className="object-cover" sizes="100vw" />
      </div>
      <figcaption className="mt-3 text-sm text-ivory/54">{caption}</figcaption>
    </figure>
  );
}
