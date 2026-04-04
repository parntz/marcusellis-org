import { getClient } from "./sqlite.mjs";

export const RECORDING_SIDEBAR_FAMILY = "recording_sidebar";

/** Default payloads (mirror current /recording UI when DB is empty). */
export const DEFAULT_RECORDING_SIDEBAR_BOXES = [
  {
    kind: "contact",
    payload: {
      heading: "Recording Department",
      phoneDisplay: "615-244-9514",
      phoneHref: "tel:+16152449514",
      cta: "Call for more information",
      staff: [
        { name: "Billy Lynn", email: "billy@nashvillemusicians.org", role: "Director of Recording" },
        { name: "William Sansbury", email: "william@nashvillemusicians.org", role: "" },
        { name: "Paige Conners", email: "paige@nashvillemusicians.org", role: "" },
      ],
    },
  },
  {
    kind: "rate",
    payload: {
      heading: "Rate Update",
      paragraph:
        "AFM SRLA scales updated 2025-04-01 — see Scales, Forms & Agreements for current rates.",
    },
  },
  {
    kind: "bforms",
    payload: {
      heading: "B Forms",
      body:
        "Blank AFM recording contracts available online. B-4 covers most SRLA categories, B-5 for Demo sessions, B-9 for Limited Pressing.",
      linkLabel: "View under Scales, Forms & Agreements →",
      linkHref: "/scales-forms-agreements",
    },
  },
  {
    kind: "cta_group",
    payload: {
      items: [
        {
          title: "Info Sheet",
          subtitle: "Summarizing all recording scales",
          href: "https://nashvillemusicians.org/sites/default/files/RECORDINGSCALESUMMARYSHEET0203%202025A.pdf",
          external: true,
        },
        {
          title: "Scales & Agreements",
          subtitle: "Recording scales, forms, and contract information",
          href: "/scales-forms-agreements",
          external: false,
        },
      ],
    },
  },
];

function clonePayload(payload) {
  return JSON.parse(JSON.stringify(payload));
}

function parseBoxesPayload(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(String(raw));
  } catch {
    return {};
  }
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
