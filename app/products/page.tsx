import type { Metadata } from "next";
import { assets } from "@/lib/assets";
import { getProducts } from "@/db/queries";
import { DisclaimerBox } from "@/components/DisclaimerBox";
import { ImageHero } from "@/components/ImageHero";
import { ProductDirectory } from "@/components/ProductDirectory";

export const metadata: Metadata = {
  title: "Products and Affiliations",
  description: "A careful resource directory of external information, affiliated products, books, courses, and partner resources."
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <>
      <ImageHero title="Resources, affiliations, and personal research links." subtitle="Every item is framed as educational material or an external resource, not a cure, treatment, prevention strategy, or replacement for professional care." image={assets.businessPhotoOne} eyebrow="Products & affiliations" />
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-5 md:grid-cols-2">
          <DisclaimerBox type="medical" />
          <DisclaimerBox type="affiliate" />
        </div>
        <div className="mt-10">
          <ProductDirectory products={products} />
        </div>
      </section>
    </>
  );
}
