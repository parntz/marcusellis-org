import Image from "next/image";

export default function CatchAllLoading() {
  return (
    <article className="page-frame page-frame--route-loading" aria-label="Loading page">
      <div className="route-loading-mark" aria-hidden="true">
        <Image src="/images/nma-logo.png" alt="" width={205} height={161} priority />
      </div>
    </article>
  );
}
