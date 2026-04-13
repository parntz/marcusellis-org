import { getClient } from "./sqlite.mjs";
import { resolveLegacyAssetHref } from "./legacy-asset-href.mjs";
import { normalizeSidebarRoute } from "./normalize-sidebar-route.mjs";

export const RECORDING_SIDEBAR_FAMILY = "recording_sidebar";

/** Default payloads for placeholder/demo routes when DB is empty. */
export const DEFAULT_RECORDING_SIDEBAR_BOXES = [
  {
    kind: "contact",
    payload: {
      heading: "Project Desk",
      phoneDisplay: "555-0147",
      phoneHref: "tel:+15550147",
      cta: "Call the placeholder office",
      staff: [
        { name: "Maren Vale", email: "maren@northstar.test", role: "Studio Director" },
        { name: "Silas Mercer", email: "silas@northstar.test", role: "Operations Lead" },
        { name: "Cleo Winters", email: "cleo@northstar.test", role: "Front Desk" },
      ],
    },
  },
  {
    kind: "rate",
    payload: {
      heading: "Planning Note",
      paragraph:
        "This sidebar uses fully fictional placeholder content meant to demonstrate panel layouts, CTA groupings, and contact styling before real copy is written.",
    },
  },
  {
    kind: "bforms",
    payload: {
      heading: "Starter Brief",
      body:
        "Use this slot for a short process note, a featured document, or a compact explanation of what users can do on the page they are viewing.",
      linkLabel: "Open the About Us page →",
      linkHref: "/about-us",
    },
  },
  {
    kind: "cta_group",
    payload: {
      items: [
        {
          title: "About Us",
          subtitle: "Fictional team profile and studio notes",
          href: "/about-us",
          external: false,
        },
        {
          title: "News & Events",
          subtitle: "Sample updates and announcement layouts",
          href: "/news-and-events",
          external: false,
        },
      ],
    },
  },
];

/** In-memory default when a route has no saved sidebar (not persisted until an admin saves). */
export function buildDefaultPanelsSidebarBoxes(pageRouteInput) {
  const route = normalizeSidebarRoute(pageRouteInput);
  const enc = encodeURIComponent(route);
  const disableHref = `/api/site-config/route-sidebar/disable?route=${enc}&redirect=${enc}`;
  const html = `<p>This sidebar is using fictional placeholder content so layouts can be tested without real organization copy. <a class="recording-callout-link" href="${disableHref}">Remove panels for this page</a>.</p>`;
  return [
    {
      kind: "contact",
      payload: {
        heading: "Placeholder Contact",
        appearance: {
          layoutName: "standard",
          styleName: "union-banner",
          accentColor: "cyan",
          showAccentStrip: true,
        },
        contentBlocks: [
          {
            type: "text",
            text: "Northstar Atelier is a made-up studio name used for demos, previews, and CMS testing.",
          },
          {
            type: "phone",
            phoneDisplay: "555-0147",
            phoneHref: "tel:+15550147",
            supportingText: "Placeholder office line for prototype content.",
          },
        ],
      },
    },
    {
      kind: "bforms",
      payload: {
        heading: "Sidebar Notes",
        appearance: {
          layoutName: "feature",
          styleName: "union-banner",
          accentColor: "deep-blue",
          showAccentStrip: true,
        },
        contentBlocks: [
          { type: "html", html },
          {
            type: "link",
            label: "View the fictional About Us page",
            href: "/about-us",
            external: false,
            supportingText: "Useful as a starter card until route-specific content is written.",
          },
        ],
      },
    },
    {
      kind: "cta_group",
      payload: {
        appearance: {
          layoutName: "standard",
          styleName: "union-banner",
          accentColor: "coral",
          showAccentStrip: true,
        },
        items: [
          {
            title: "Sample Directory",
            subtitle: "Placeholder names and roles",
            href: "/about-us",
            external: false,
          },
          {
            title: "Editorial Sandbox",
            subtitle: "Use this box for testing CTA layouts",
            href: "/news-and-events",
            external: false,
          },
        ],
      },
    },
  ];
}

function clonePayload(payload) {
  return JSON.parse(JSON.stringify(payload));
}

function parseBoxesPayload(raw) {
  if (!raw) return {};
  try {
    return normalizeSidebarPayloadLinks(JSON.parse(String(raw)));
  } catch {
    return {};
  }
}

function normalizeSidebarPayloadLinks(value, parentKey = "") {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeSidebarPayloadLinks(item, parentKey));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, normalizeSidebarPayloadLinks(entryValue, key)])
    );
  }
  if (typeof value === "string" && ["href", "linkHref", "src"].includes(parentKey)) {
    return resolveLegacyAssetHref(value);
  }
  return value;
}

export async function listSidebarBoxesForPage(pageRoute) {
  try {
    const client = getClient();
    const setRs = await client.execute({
      sql: `SELECT id FROM sidebar_box_sets WHERE page_route = ?`,
      args: [pageRoute],
    });
    if (!setRs.rows.length) {
      return [];
    }
    const setId = setRs.rows[0].id;
    const rs = await client.execute({
      sql: `
        SELECT id, kind, payload_json FROM sidebar_boxes
        WHERE set_id = ?
        ORDER BY sort_order ASC, id ASC
      `,
      args: [setId],
    });
    return rs.rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      payload: parseBoxesPayload(row.payload_json),
    }));
  } catch {
    return [];
  }
}

export async function listSidebarSetsByFamily(familyKey) {
  const client = getClient();
  const rs = await client.execute({
    sql: `
      SELECT
        s.id AS set_id,
        s.family_key AS familyKey,
        s.page_route AS pageRoute,
        b.id AS box_id,
        b.sort_order AS sortOrder,
        b.kind,
        b.payload_json AS payloadJson
      FROM sidebar_box_sets s
      LEFT JOIN sidebar_boxes b ON b.set_id = s.id
      WHERE s.family_key = ?
      ORDER BY s.page_route ASC, b.sort_order ASC, b.id ASC
    `,
    args: [familyKey],
  });

  const bySet = new Map();
  for (const row of rs.rows) {
    const sid = row.set_id;
    if (!bySet.has(sid)) {
      bySet.set(sid, {
        setId: sid,
        familyKey: row.familyKey,
        pageRoute: row.pageRoute,
        boxes: [],
      });
    }
    if (row.box_id != null) {
      bySet.get(sid).boxes.push({
        id: row.box_id,
        sortOrder: row.sortOrder ?? 0,
        kind: row.kind,
        payload: parseBoxesPayload(row.payloadJson),
      });
    }
  }
  return Array.from(bySet.values());
}

export async function replaceSidebarBoxesForPage(pageRoute, familyKey, boxes) {
  const client = getClient();
  if (!Array.isArray(boxes) || !boxes.length) {
    throw new Error("boxes must be a non-empty array");
  }

  await client.execute({
    sql: `
      INSERT INTO sidebar_box_sets (family_key, page_route, created_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(page_route) DO UPDATE SET family_key = excluded.family_key
    `,
    args: [familyKey, pageRoute],
  });

  const setRs = await client.execute({
    sql: `SELECT id FROM sidebar_box_sets WHERE page_route = ?`,
    args: [pageRoute],
  });
  const setId = setRs.rows[0].id;

  await client.execute({
    sql: `DELETE FROM sidebar_boxes WHERE set_id = ?`,
    args: [setId],
  });

  const insertBatch = [];
  for (let i = 0; i < boxes.length; i += 1) {
    const box = boxes[i];
    const kind = typeof box.kind === "string" ? box.kind : "";
    const payload = box.payload && typeof box.payload === "object" ? box.payload : {};
    insertBatch.push({
      sql: `
        INSERT INTO sidebar_boxes (set_id, sort_order, kind, payload_json)
        VALUES (?, ?, ?, ?)
      `,
      args: [setId, i, kind, JSON.stringify(payload)],
    });
  }
  await client.batch(insertBatch, "write");
  return listSidebarBoxesForPage(pageRoute);
}

export async function deleteSidebarSetForPage(pageRoute) {
  const client = getClient();
  const setRs = await client.execute({
    sql: `SELECT id FROM sidebar_box_sets WHERE page_route = ?`,
    args: [pageRoute],
  });
  const setId = setRs.rows?.[0]?.id;
  if (!setId) {
    return false;
  }

  await client.execute({
    sql: `DELETE FROM sidebar_boxes WHERE set_id = ?`,
    args: [setId],
  });
  await client.execute({
    sql: `DELETE FROM sidebar_box_sets WHERE id = ?`,
    args: [setId],
  });
  return true;
}

/** Copy an existing page’s boxes to another route (independent payloads). */
export async function duplicateSidebarToPage(fromRoute, toRoute, familyKey) {
  const boxes = await listSidebarBoxesForPage(fromRoute);
  const source =
    boxes.length > 0
      ? boxes.map(({ kind, payload }) => ({ kind, payload: clonePayload(payload) }))
      : DEFAULT_RECORDING_SIDEBAR_BOXES.map(({ kind, payload }) => ({
          kind,
          payload: clonePayload(payload),
        }));
  return replaceSidebarBoxesForPage(toRoute, familyKey, source);
}
