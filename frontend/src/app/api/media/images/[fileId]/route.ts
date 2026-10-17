import { getBackendUrl, readAuthToken } from "@/lib/auth";

export const runtime = "nodejs";

const privateHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};

/** Aperçu vendeur : le navigateur garde son cookie, le backend contrôle le droit réel. */
export async function GET(request: Request, context: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await context.params;
  const version = new URL(request.url).searchParams.get("v");
  if (!/^[a-f0-9]{24}$/i.test(fileId) || (version !== null && !/^[A-Za-z0-9._-]{1,120}$/.test(version))) {
    return Response.json({ success: false, message: "Image introuvable" }, { status: 404, headers: privateHeaders });
  }
  const token = await readAuthToken();
  if (!token) return Response.json({ success: false, message: "Authentification requise" }, { status: 401, headers: privateHeaders });

  try {
    const response = await fetch(`${getBackendUrl()}/api/media/images/${fileId}${version ? `?v=${encodeURIComponent(version)}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok || response.headers.get("content-type")?.split(";")[0] !== "image/webp") {
      void response.body?.cancel().catch(() => {});
      return Response.json({ success: false, message: "Image introuvable" }, {
        status: response.status === 401 ? 401 : response.status === 503 ? 503 : 404,
        headers: privateHeaders,
      });
    }
    return new Response(response.body, { headers: { ...privateHeaders, "Content-Type": "image/webp" } });
  } catch {
    return Response.json({ success: false, message: "Image momentanément indisponible" }, { status: 503, headers: privateHeaders });
  }
}
