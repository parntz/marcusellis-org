"use client";

import { useEffect } from "react";

export function FindArtistEnhancer() {
  useEffect(() => {
    const root = document.querySelector(".find-artist-main");
    if (!root) return undefined;

    const form = root.querySelector("form");
    const titleInput = root.querySelector('input[name="title"]');
    const titleLabel = root.querySelector('label[for="edit-title"]');
    const submitInput = root.querySelector('input[type="submit"]');
    const styleLabel = root.querySelector('label[for="edit-field-musical-style-s-tid"]');
    const styleSelect = root.querySelector('select[name="field_musical_style_s__tid"]');
    const table = root.querySelector("table");
    const rows = table ? Array.from(table.querySelectorAll("tbody tr")) : [];

    // Hide legacy music-style filter controls.
    if (styleLabel) {
      styleLabel.style.display = "none";
      const maybeBlock = styleLabel.closest("div");
      if (maybeBlock) maybeBlock.style.display = "none";
    }
    if (styleSelect) {
      styleSelect.style.display = "none";
      const maybeBlock = styleSelect.closest("div");
      if (maybeBlock) maybeBlock.style.display = "none";
    }

    // Keep one broad search input with explicit label.
    if (titleLabel) {
      titleLabel.style.display = "none";
    }
    if (titleInput) {
      titleInput.type = "search";
      titleInput.placeholder = "Search artists, bands, styles, or instruments...";
      titleInput.autocomplete = "off";
      titleInput.setAttribute("aria-label", "Search artist, instrument, music style, or band name");
    }
    if (submitInput) {
      submitInput.value = "Search";
    }

    const rowListeners = [];
    rows.forEach((row) => {
      const profileLink = row.querySelector("td:last-child a") || row.querySelector("td:first-child a");
      const href = profileLink?.getAttribute("href");
      if (!href) return;

      row.classList.add("find-artist-row-link");
      row.tabIndex = 0;
      row.setAttribute("role", "link");
      row.setAttribute("aria-label", `View profile for ${profileLink.textContent?.trim() || "artist or band"}`);

      const onClick = (event) => {
        if (event.defaultPrevented) return;
        if (event.target instanceof Element && event.target.closest("a")) return;
        window.location.href = href;
      };

      const onKeyDown = (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        window.location.href = href;
      };

      row.addEventListener("click", onClick);
      row.addEventListener("keydown", onKeyDown);
      rowListeners.push([row, onClick, onKeyDown]);
    });

    const filterRows = () => {
      if (!titleInput) return;
      const q = titleInput.value.trim().toLowerCase();
      rows.forEach((row) => {
        if (!q) {
          row.style.display = "";
          return;
        }
        const haystack = row.textContent?.toLowerCase() || "";
        row.style.display = haystack.includes(q) ? "" : "none";
      });
    };

    titleInput?.addEventListener("input", filterRows);
    const onSubmit = (event) => {
      event.preventDefault();
      filterRows();
    };
    form?.addEventListener("submit", onSubmit);

    return () => {
      rowListeners.forEach(([row, onClick, onKeyDown]) => {
        row.removeEventListener("click", onClick);
        row.removeEventListener("keydown", onKeyDown);
      });
      titleInput?.removeEventListener("input", filterRows);
      form?.removeEventListener("submit", onSubmit);
    };
  }, []);

  return null;
}
