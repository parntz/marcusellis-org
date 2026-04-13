import { DefaultBrandMark } from "../../components/default-brand-mark";

export default function CatchAllLoading() {
  return (
    <article className="page-frame page-frame--route-loading" aria-label="Loading page">
      <div className="route-loading-mark" aria-hidden="true">
        <DefaultBrandMark className="default-brand-mark--loading" title="Loading page" />
      </div>
    </article>
  );
}
