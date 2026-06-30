import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type BackendUploadBody = {
  message?: string;
  data?: {
    image?: {
      url?: string;
      publicId?: string;
      width?: number | null;
      height?: number | null;
      format?: string;
      bytes?: number;
      mimeType?: string;
    };
  };
};

function toDataUrl(file: File, buffer: ArrayBuffer) {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

export async function POST(request: Request) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", image: null },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, message: "Fichier image invalide.", image: null },
      { status: 400 },
    );
  }

  const fileEntry = form.get("image");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json(
      { success: false, message: "Image requise.", image: null },
      { status: 422 },
    );
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(fileEntry.type)) {
    return NextResponse.json(
      {
        success: false,
        message: "Format image non supporté. Utilisez JPG, PNG, WebP ou AVIF.",
        image: null,
      },
      { status: 422 },
    );
  }

  if (fileEntry.size <= 0 || fileEntry.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      {
        success: false,
        message: "Image trop lourde. Taille maximum : 4 Mo.",
        image: null,
      },
      { status: 422 },
    );
  }

  let imageDataUrl: string;
  try {
    imageDataUrl = toDataUrl(fileEntry, await fileEntry.arrayBuffer());
  } catch {
    return NextResponse.json(
      { success: false, message: "Lecture de l'image impossible.", image: null },
      { status: 400 },
    );
  }

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson("/api/uploads/product-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        imageDataUrl,
        fileName: fileEntry.name,
      }),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service d'upload indisponible. Réessayez plus tard.",
        image: null,
      },
      { status: 503 },
    );
  }

  const body = result.body as BackendUploadBody | null;
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: body?.message ?? "Upload image impossible.",
        image: null,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: body?.message ?? "Image produit téléversée",
      image: body?.data?.image ?? null,
    },
    { status: 201 },
  );
}
