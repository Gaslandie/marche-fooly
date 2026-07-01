import { NextResponse } from "next/server";
import { getBackendUrl, readAuthToken } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type BackendUploadBody = {
  success?: boolean;
  message?: string;
  data?: {
    image?: {
      id?: string;
      url?: string;
      largeUrl?: string;
      thumbUrl?: string;
      fileId?: string;
      largeFileId?: string;
      thumbFileId?: string;
      version?: string;
      width?: number | null;
      height?: number | null;
      format?: string;
      bytes?: number;
      mimeType?: string;
      sourceMimeType?: string;
    };
  };
};
type BackendImage = NonNullable<NonNullable<BackendUploadBody["data"]>["image"]>;

function resolveBackendMediaUrl(value: string | undefined) {
  if (!value) return value;
  if (value.startsWith("/api/")) return `${getBackendUrl()}${value}`;
  return value;
}

function normalizeImage(image?: BackendImage) {
  if (!image || typeof image !== "object") return null;
  return {
    ...image,
    url: resolveBackendMediaUrl(image.url),
    largeUrl: resolveBackendMediaUrl(image.largeUrl),
    thumbUrl: resolveBackendMediaUrl(image.thumbUrl),
  };
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

  const backendForm = new FormData();
  backendForm.append("image", fileEntry, fileEntry.name);

  let res: Response;
  try {
    res = await fetch(`${getBackendUrl()}/api/uploads/product-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: backendForm,
      cache: "no-store",
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

  const body = (await res.json().catch(() => null)) as BackendUploadBody | null;
  if (!res.ok) {
    return NextResponse.json(
      {
        success: false,
        message: body?.message ?? "Upload image impossible.",
        image: null,
      },
      { status: res.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: body?.message ?? "Image produit téléversée",
      image: normalizeImage(body?.data?.image),
    },
    { status: 201 },
  );
}
