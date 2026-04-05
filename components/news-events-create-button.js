"use client";

export function NewsEventsCreateButton() {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("news-events:create"));
  }

  return (
    <button type="button" className="btn btn-primary page-header-action-button" onClick={handleClick}>
      Add News/Event
    </button>
  );
}
