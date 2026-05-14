"use server";

import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { requireUser } from "@/lib/session";

// Stub upload action. In dev with DB_DRIVER=memory this writes to
// public/uploads/<userId>/<random>.<ext>.
// In production with Supabase, swap this body to upload to a Storage bucket.
// See PRODUCTION.md → "Image uploads".
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const schema = z.object({
  filename: z.string().min(1),
  mime: z.string(),
});

export async function uploadListingPhotoAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("Nedostaje datoteka");
  if (file.size > MAX_BYTES) throw new Error("Datoteka prevelika (max 8 MB)");
  if (!ALLOWED.has(file.type)) throw new Error("Nepodržan format slike");

  const { filename, mime } = schema.parse({ filename: file.name, mime: file.type });
  const ext = mime.split("/")[1] ?? "bin";
  const random = crypto.randomUUID().replace(/-/g, "");
  const subdir = path.join(process.cwd(), "public", "uploads", user.id);
  if (!existsSync(subdir)) await mkdir(subdir, { recursive: true });
  const dest = path.join(subdir, `${random}.${ext}`);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buf);
  return { url: `/uploads/${user.id}/${random}.${ext}`, filename };
}
