import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  ACERVO_STORAGE_BUCKET,
  createSupabaseAdminClient,
} from "@/lib/supabase/server";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const SUPPORTED_EXTENSIONS = new Set(Object.values(MIME_EXTENSIONS));
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export async function uploadAdminMedia(
  formData: FormData,
  fieldName: string,
  folder: string,
) {
  const file = getUploadedFile(formData, fieldName);

  if (!file) {
    return null;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY para subir archivos a Supabase Storage.",
    );
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error("La imagen debe pesar menos de 10 MB.");
  }

  const extension = getFileExtension(file);

  if (!extension) {
    throw new Error("Formato de imagen no soportado. Usa JPG, PNG, WebP, GIF o AVIF.");
  }

  const storagePath = `${folder}/${Date.now()}-${randomUUID()}${extension}`;
  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(ACERVO_STORAGE_BUCKET)
    .upload(storagePath, Buffer.from(bytes), {
      cacheControl: "31536000",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`No se pudo subir el archivo a Storage: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(ACERVO_STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

function getUploadedFile(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (!value || typeof value === "string") {
    return null;
  }

  const file = value as File;

  if (typeof file.arrayBuffer !== "function" || file.size <= 0) {
    return null;
  }

  return file;
}

function getFileExtension(file: File) {
  const extension = path.extname(file.name ?? "").toLowerCase();

  if (SUPPORTED_EXTENSIONS.has(extension)) {
    return extension;
  }

  return MIME_EXTENSIONS[file.type] ?? "";
}
