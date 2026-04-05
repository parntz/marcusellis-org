"use client";

export function GigsCreateButton() {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("gigs:create"));
  }

  return (
    <button type="button" className="btn btn-primary gigs-page-header__add" onClick={handleClick}>
      Add Gig
    </button>
  );
}
