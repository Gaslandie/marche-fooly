import Image, { type ImageProps } from "next/image";

/** Les anciens médias externes restent affichables sans élargir la liste autorisée. */
function canOptimize(src: string): boolean {
  if (src.startsWith("/images/")) return true;
  try {
    const url = new URL(src);
    const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000");
    // Next bloque les IP locales ; en développement on conserve le chargement direct.
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return !local && url.origin === api.origin && url.pathname.startsWith("/api/media/images/");
  } catch {
    return false;
  }
}

export default function ProductImage(props: Omit<ImageProps, "src"> & { src: string }) {
  return <Image {...props} alt={props.alt} unoptimized={!canOptimize(props.src)} />;
}
