"use client";

export function MemberSiteLinksCreateButton() {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("member-site-links:create"));
  }

  return (
    <button type="button" className="btn btn-primary page-header-action-button" onClick={handleClick}>
      Add Site Link
    </button>
  );
}
