"use client";

import { useEffect } from "react";

export function ProfilePageEnhancer() {
  useEffect(() => {
    const profileRoot = document.querySelector(".pg-profile .page-content");
    if (!profileRoot) return;
    if (profileRoot.dataset.profileEnhanced === "true") return;

    const headings = Array.from(profileRoot.querySelectorAll("h2"));
    const cards = [];

    for (const heading of headings) {
      const payload = heading.nextElementSibling;
      if (!payload) continue;

      const label = (heading.textContent || "")
        .replace(/\s+/g, " ")
        .replace(/\(s\)/gi, "s")
        .replace(/:$/, "")
        .trim();
      if (!label) continue;

      const card = document.createElement("section");
      card.className = "profile-cta-card";

      const eyebrow = document.createElement("p");
      eyebrow.className = "profile-cta-card__eyebrow";
      eyebrow.textContent = label;
      card.appendChild(eyebrow);

      const body = document.createElement("div");
      body.className = "profile-cta-card__body";
      body.appendChild(payload);
      card.appendChild(body);

      heading.parentNode?.insertBefore(card, heading);
      heading.remove();
      cards.push(card);
    }

    if (cards.length > 1) {
      const grid = document.createElement("div");
      grid.className = "profile-cta-grid";
      cards[0].parentNode?.insertBefore(grid, cards[0]);
      cards.forEach((card) => grid.appendChild(card));
    }

    const stylesCard = Array.from(profileRoot.querySelectorAll(".profile-cta-card")).find((card) =>
      /musical style/i.test(card.querySelector(".profile-cta-card__eyebrow")?.textContent || "")
    );
    const stylesContainer = stylesCard?.querySelector(".profile-cta-card__body");
    if (stylesContainer) {
      const links = Array.from(stylesContainer.querySelectorAll('a[href^="/musical-styles/"]'));
      if (links.length) {
        stylesCard.classList.add("profile-cta-card--styles");
        const sorted = [...links]
          .map((link) => ({
            href: link.getAttribute("href") || "",
            label: (link.textContent || "").trim(),
          }))
          .filter((item) => item.label)
          .sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" }));

        const listWrap = document.createElement("div");
        listWrap.className = "profile-style-wrap";

        const list = document.createElement("ul");
        list.className = "profile-style-list";

        sorted.forEach((item) => {
          const styleText = document.createElement("li");
          styleText.textContent = item.label;
          if (item.href) {
            styleText.setAttribute("data-style-href", item.href);
          }
          list.appendChild(styleText);
        });

        listWrap.appendChild(list);
        stylesContainer.replaceChildren(listWrap);
      }
    }

    const descriptionCard = Array.from(profileRoot.querySelectorAll(".profile-cta-card")).find((card) =>
      /^description$/i.test((card.querySelector(".profile-cta-card__eyebrow")?.textContent || "").trim())
    );
    const descriptionText = (descriptionCard?.querySelector(".profile-cta-card__body")?.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    const hasLongDescription = descriptionText.length >= 260;
    const profileImage = profileRoot.querySelector("img");

    if (descriptionCard && hasLongDescription && profileImage) {
      const contentHost = profileRoot.querySelector(":scope > div") || profileRoot;
      let imageBlock = profileImage;
      while (
        imageBlock.parentElement &&
        imageBlock.parentElement !== contentHost &&
        !imageBlock.parentElement.contains(descriptionCard)
      ) {
        imageBlock = imageBlock.parentElement;
      }

      if (contentHost.contains(imageBlock) && contentHost.contains(descriptionCard)) {
        const heroRow = document.createElement("section");
        heroRow.className = "profile-hero-row";

        const imageWrap = document.createElement("div");
        imageWrap.className = "profile-hero-image-wrap";
        imageWrap.appendChild(imageBlock);

        descriptionCard.classList.add("profile-cta-card--hero-description");
        heroRow.appendChild(imageWrap);
        heroRow.appendChild(descriptionCard);

        contentHost.insertBefore(heroRow, imageBlock);
      }
    }

    profileRoot.dataset.profileEnhanced = "true";
  }, []);

  return null;
}
