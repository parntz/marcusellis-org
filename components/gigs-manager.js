"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { GigsList } from "./gigs-list";
import { ModalLightbox } from "./modal-lightbox";

const GOOGLE_MAPS_API_KEY = (() => {
  const value = String(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
  return value && value.toLowerCase() !== "undefined" ? value : "";
})();
let googlePlacesPromise = null;
let googlePlacesLoadedKey = "";

function emptyGigForm() {
  return {
    startAt: "",
    endAt: "",
    bandName: "",
    locationName: "",
    locationAddress: "",
    googlePlaceId: "",
    artistsText: "",
    notes: "",
    imageUrl: "",
  };
}

function sortGigs(items) {
  return [...items].sort((a, b) => {
    if (a.startAt === b.startAt) return a.id - b.id;
    return a.startAt.localeCompare(b.startAt);
  });
}

function removeGoogleMapsScripts() {
  const scripts = document.querySelectorAll('script[src*="maps.googleapis.com/maps/api/js"]');
  scripts.forEach((script) => {
    script.parentNode?.removeChild(script);
  });
}

function loadGooglePlacesApi(apiKey) {
  if (!apiKey || typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (window.google?.maps?.places?.PlaceAutocompleteElement && googlePlacesLoadedKey === apiKey) {
    return Promise.resolve(window.google);
  }

  if (googlePlacesLoadedKey && googlePlacesLoadedKey !== apiKey) {
    googlePlacesPromise = null;
    googlePlacesLoadedKey = "";
    removeGoogleMapsScripts();
  }

  if (!googlePlacesPromise) {
    googlePlacesPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-places-loader="true"]');
      if (existing) {
        const existingKey = existing.getAttribute("data-google-places-key") || "";
        if (existingKey && existingKey !== apiKey) {
          removeGoogleMapsScripts();
        } else {
          googlePlacesLoadedKey = existingKey || apiKey;
          existing.addEventListener("load", () => resolve(window.google), { once: true });
          existing.addEventListener("error", () => reject(new Error("Google Places failed to load.")), {
            once: true,
          });
          return;
        }
      }

      removeGoogleMapsScripts();

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.googlePlacesLoader = "true";
      script.dataset.googlePlacesKey = apiKey;
      script.onload = () => {
        googlePlacesLoadedKey = apiKey;
        resolve(window.google);
      };
      script.onerror = () => {
        googlePlacesLoadedKey = "";
        reject(new Error("Google Places failed to load."));
      };
      document.head.appendChild(script);
    })
      .then(async (google) => {
        if (typeof google?.maps?.importLibrary === "function") {
          await google.maps.importLibrary("places");
        }
        if (!google?.maps?.places?.PlaceAutocompleteElement) {
          throw new Error("Places library did not expose PlaceAutocompleteElement.");
        }
        return google;
      })
      .catch((error) => {
        googlePlacesPromise = null;
        googlePlacesLoadedKey = "";
        throw error;
      });
  }

  return googlePlacesPromise;
}

function formFromGig(gig) {
  return {
    startAt: gig.startAt || "",
    endAt: gig.endAt || "",
    bandName: gig.bandName || "",
    locationName: gig.locationName || "",
    locationAddress: gig.locationAddress || "",
    googlePlaceId: gig.googlePlaceId || "",
    artistsText: (gig.artists || []).join("\n"),
    notes: gig.notes || "",
    imageUrl: gig.imageUrl || "",
  };
}

export function GigsManager({ initialGigs = [] }) {
  const router = useRouter();
  const [gigs, setGigs] = useState(() => sortGigs(initialGigs));
  const [editingId, setEditingId] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(() => emptyGigForm());
  const [saveBusy, setSaveBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState("");
  const [placesStatus, setPlacesStatus] = useState(
    GOOGLE_MAPS_API_KEY ? "Loading Google Places…" : "Google Places API key not configured. Enter venue details manually."
  );
  const placeHostRef = useRef(null);

  useEffect(() => {
    setGigs(sortGigs(initialGigs));
  }, [initialGigs]);

  useEffect(() => {
    const host = placeHostRef.current;
    if (!editorOpen || !host || !GOOGLE_MAPS_API_KEY) {
      return undefined;
    }

    let cancelled = false;
    let placeElement = null;
    let handleSelect = null;
    let handleError = null;

    setPlacesStatus("Loading Google Places…");
    loadGooglePlacesApi(GOOGLE_MAPS_API_KEY)
      .then((google) => {
        if (cancelled || !google?.maps?.places?.PlaceAutocompleteElement || !placeHostRef.current) {
          return;
        }

        try {
          placeElement = new google.maps.places.PlaceAutocompleteElement();
          placeElement.classList.add("gigs-editor__places-input");
          placeElement.id = "gig-place-search";
          placeElement.setAttribute("placeholder", "Start typing a venue or address");
          placeHostRef.current.replaceChildren(placeElement);
        } catch (e) {
          if (!cancelled) {
            console.error("[gigs] PlaceAutocompleteElement constructor failed:", e);
            setPlacesStatus(
              "Google Places failed to attach to the field. Check the browser console and API key settings."
            );
          }
          return;
        }

        handleSelect = async (event) => {
          try {
            const prediction = event?.placePrediction || event?.detail?.placePrediction;
            if (!prediction?.toPlace) {
              return;
            }

            const place = prediction.toPlace();
            await place.fetchFields({
              fields: ["displayName", "formattedAddress", "id"],
            });

            setForm((current) => ({
              ...current,
              locationName: place.displayName?.text || current.locationName,
              locationAddress: place.formattedAddress || current.locationAddress,
              googlePlaceId: place.id || current.googlePlaceId,
            }));
            setPlacesStatus("Google Places ready.");
          } catch (selectionError) {
            console.error("[gigs] Place selection failed:", selectionError);
            setPlacesStatus("Google Places could not read the selected venue. Enter the details manually.");
          }
        };

        handleError = (event) => {
          console.error("[gigs] PlaceAutocompleteElement request failed:", event);
          setPlacesStatus(
            "Google Places rejected the request. Enable Maps JavaScript API and Places API on this Google project, then recheck referrer restrictions."
          );
        };

        placeElement.addEventListener("gmp-select", handleSelect);
        placeElement.addEventListener("gmp-error", handleError);

        setPlacesStatus("Google Places ready.");
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[gigs] Google Maps / Places load failed:", err);
          setPlacesStatus(
            "Google Places could not load. Confirm NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, enable Maps JavaScript API + Places API, billing, and referrer http://localhost:3000/* (or None for testing)."
          );
        }
      });

    return () => {
      cancelled = true;
      if (placeElement && handleSelect) {
        placeElement.removeEventListener("gmp-select", handleSelect);
      }
      if (placeElement && handleError) {
        placeElement.removeEventListener("gmp-error", handleError);
      }
      if (placeElement && placeElement.parentNode) {
        placeElement.parentNode.removeChild(placeElement);
      }
    };
  }, [editorOpen]);

  const resetForm = useCallback(() => {
    setEditingId(0);
    setForm(emptyGigForm());
    setError("");
  }, []);

  function closeEditor() {
    setEditorOpen(false);
    resetForm();
  }

  const beginCreate = useCallback(() => {
    resetForm();
    setEditorOpen(true);
  }, [resetForm]);

  useEffect(() => {
    const handleCreate = () => beginCreate();
    window.addEventListener("gigs:create", handleCreate);
    return () => window.removeEventListener("gigs:create", handleCreate);
  }, [beginCreate]);

  function beginEdit(gig) {
    setEditingId(gig.id);
    setForm(formFromGig(gig));
    setError("");
    setEditorOpen(true);
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadBusy(true);
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/gigs/upload", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error || "Upload failed.");
        return;
      }

      setForm((current) => ({
        ...current,
        imageUrl: data.url,
      }));
    } catch {
      setError("Upload failed.");
    } finally {
      event.target.value = "";
      setUploadBusy(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveBusy(true);
    setError("");

    const payload = {
      ...form,
      artistsText: form.artistsText,
    };

    try {
      const url = editingId ? `/api/gigs/${editingId}` : "/api/gigs";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.gig) {
        setError(data.error || "Save failed.");
        return;
      }

      setGigs((current) => {
        const next = editingId
          ? current.map((item) => (item.id === data.gig.id ? data.gig : item))
          : [...current, data.gig];
        return sortGigs(next);
      });
      closeEditor();
      router.refresh();
    } catch {
      setError("Save failed.");
    } finally {
      setSaveBusy(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this gig?");
    if (!confirmed) return;

    setError("");
    try {
      const res = await fetch(`/api/gigs/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Delete failed.");
        return;
      }

      setGigs((current) => current.filter((gig) => gig.id !== id));
      if (editingId === id) {
        closeEditor();
      }
      router.refresh();
    } catch {
      setError("Delete failed.");
    }
  }

  return (
    <section className="gigs-admin">
      <GigsList gigs={gigs} isAdmin onEditGig={beginEdit} />

      <ModalLightbox open={editorOpen} onClose={closeEditor} closeLabel="Close gig editor">
        <div className="gigs-editor-modal">
          <div className="gigs-editor-modal__header">
            <p className="gigs-admin__eyebrow">Upcoming Gigs</p>
            <h3>{editingId ? "Edit Gig" : "Add Gig"}</h3>
          </div>

          <form className="gigs-editor" onSubmit={handleSubmit}>
            <div className="gigs-editor__group gigs-editor__group--wide">
              <label htmlFor="gig-place-search">Find venue with Google Places</label>
              <div ref={placeHostRef} className="gigs-editor__places-host" />
              <p className="gigs-editor__hint">{placesStatus}</p>
            </div>

            <div className="gigs-editor__group">
              <label htmlFor="gig-start-at">Start Date &amp; Time</label>
              <input
                id="gig-start-at"
                type="datetime-local"
                value={form.startAt}
                onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
                required
              />
            </div>

            <div className="gigs-editor__group">
              <label htmlFor="gig-end-at">End Date &amp; Time</label>
              <input
                id="gig-end-at"
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
              />
            </div>

            <div className="gigs-editor__group">
              <label htmlFor="gig-band-name">Band Name</label>
              <input
                id="gig-band-name"
                type="text"
                value={form.bandName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bandName: event.target.value }))
                }
                placeholder="Artist, act, or band name"
              />
            </div>

            <div className="gigs-editor__group">
              <label htmlFor="gig-location-name">Gig Location</label>
              <input
                id="gig-location-name"
                type="text"
                value={form.locationName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, locationName: event.target.value }))
                }
                placeholder="Venue or room name"
                required
              />
            </div>

            <div className="gigs-editor__group">
              <label htmlFor="gig-location-address">Location Address</label>
              <input
                id="gig-location-address"
                type="text"
                value={form.locationAddress}
                onChange={(event) =>
                  setForm((current) => ({ ...current, locationAddress: event.target.value }))
                }
                placeholder="Street, city, state"
              />
            </div>

            <div className="gigs-editor__group gigs-editor__group--wide">
              <label htmlFor="gig-artists">Gig Artists</label>
              <textarea
                id="gig-artists"
                rows="4"
                value={form.artistsText}
                onChange={(event) => setForm((current) => ({ ...current, artistsText: event.target.value }))}
                placeholder="One artist per line, or comma-separated"
                required
              />
            </div>

            <div className="gigs-editor__group gigs-editor__group--wide">
              <label htmlFor="gig-notes">Notes</label>
              <textarea
                id="gig-notes"
                rows="5"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Details about the gig"
              />
            </div>

            <div className="gigs-editor__group gigs-editor__group--wide">
              <label htmlFor="gig-image">Gig Image</label>
              <input id="gig-image" type="file" accept="image/*" onChange={handleImageUpload} />
              <p className="gigs-editor__hint">
                {uploadBusy ? "Uploading image…" : "Upload a flyer, venue image, or promo graphic."}
              </p>
              {form.imageUrl ? (
                <div className="gigs-editor__preview">
                  <img src={form.imageUrl} alt="Gig preview" />
                </div>
              ) : null}
            </div>

            {form.googlePlaceId ? (
              <div className="gigs-editor__group gigs-editor__group--wide">
                <p className="gigs-editor__hint">Google Place ID: {form.googlePlaceId}</p>
              </div>
            ) : null}

            {error ? (
              <p className="gigs-editor__error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="gigs-editor__actions">
              {editingId ? (
                <button
                  type="button"
                  className="btn btn-ghost gigs-editor__delete"
                  onClick={() => handleDelete(editingId)}
                  disabled={saveBusy || uploadBusy}
                >
                  Delete Gig
                </button>
              ) : null}
              <button type="button" className="btn btn-ghost" onClick={closeEditor} disabled={saveBusy || uploadBusy}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saveBusy || uploadBusy}>
                {saveBusy ? "Saving…" : editingId ? "Update Gig" : "Add Gig"}
              </button>
            </div>
          </form>
        </div>
      </ModalLightbox>
    </section>
  );
}
