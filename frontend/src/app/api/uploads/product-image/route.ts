import { NextResponse } from "next/server";
import { getBackendUrl, getCurrentUser, readAuthToken } from "@/lib/auth";
import { getMySellerProfile } from "@/lib/seller";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 64 * 1024;
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
  // Les uploads ne sont pas encore publics : aperçu authentifié sur notre domaine.
  if (value.startsWith("/api/media/images/")) return value;
  try {
    const url = new URL(value);
    if (url.origin === new URL(getBackendUrl()).origin && url.pathname.startsWith("/api/media/images/")) {
      return `${url.pathname}${url.search}`;
    }
  } catch { /* Une ancienne URL externe reste inchangée. */ }
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
  const user = token ? await getCurrentUser() : null;
  if (!token || !user) {
    return NextResponse.json(
      { success: false, message: "Authentification requise.", image: null },
      { status: 401 },
    );
  }
  const profile = user.role === "seller" ? await getMySellerProfile() : null;
  if (profile?.status !== "approved") {
    return NextResponse.json({ success: false, message: "Seuls les vendeurs approuvés peuvent envoyer une image.", image: null }, { status: 403 });
  }

  const tooLarge = () => NextResponse.json({ success: false, message: "Image trop lourde. Taille maximum : 4 Mo.", image: null }, { status: 413 });
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) return tooLarge();

  let form: FormData;
  try {
    if (!request.body) throw new Error("Corps absent");
    const reader = request.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_REQUEST_BYTES) {
        void reader.cancel().catch(() => {});
        return tooLarge();
      }
      chunks.push(new Uint8Array(value));
    }
    form = await new Response(new Blob(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    return NextResponse.json(
      { success: false, message: "Fichier image invalide.", image: null },
      { status: 400 },
    );
  }

  const fileEntry = form.get("image");
  if (!(fileEntry instanceof File) || Array.from(form.keys()).length !== 1) {
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
