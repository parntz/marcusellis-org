import "./load-env.mjs";
import fs from "fs";
import path from "path";
import {
  getGigUploadsStore,
  guessGigImageContentType,
  storeGigImageBuffer,
} from "../lib/gig-image-storage.mjs";

const uploadsDir = path.join(process.cwd(), "public", "uploads", "gigs");

if (!fs.existsSync(uploadsDir)) {
  console.log(`No local gig uploads found at ${uploadsDir}`);
  process.exit(0);
}

const files = fs.readdirSync(uploadsDir).filter((name) => {
  const filePath = path.join(uploadsDir, name);
  return fs.statSync(filePath).isFile();
});

const store = await getGigUploadsStore();
if (!store) {
  throw new Error(
    "Netlify Blobs access is not configured locally. Set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN (or NETLIFY_PERSONAL_ACCESS_TOKEN), then rerun this script."
  );
}

let migrated = 0;

for (const filename of files) {
  const filePath = path.join(uploadsDir, filename);
  const buffer = fs.readFileSync(filePath);
  await storeGigImageBuffer(buffer, {
    mimeType: guessGigImageContentType(filename),
    filename,
    preferredId: filename,
  });
  migrated += 1;
}

console.log(`Migrated ${migrated} gig image(s) to Netlify Blobs.`);
