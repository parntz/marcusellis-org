import { getClient } from "./sqlite.mjs";

export async function listMemberInquiries(limit = 50) {
  const client = getClient();
  const rs = await client.execute({
    sql: `
    SELECT id, name, email, topic, message, created_at AS createdAt
    FROM member_inquiries
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `,
    args: [limit],
  });

  return rs.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    topic: row.topic,
    message: row.message,
    createdAt: row.createdAt,
  }));
}

export async function createMemberInquiry({ name, email, topic, message }) {
  const client = getClient();
  const rs = await client.execute({
    sql: `
    INSERT INTO member_inquiries (name, email, topic, message)
    VALUES (?, ?, ?, ?)
  `,
    args: [name, email, topic, message],
  });

  return rs.lastInsertRowid != null ? Number(rs.lastInsertRowid) : 0;
}
