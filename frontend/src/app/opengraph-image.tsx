import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.slogan}, ${siteConfig.location}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image publique fixe : uniquement les visuels et les informations de marque existants.
export default async function OpenGraphImage() {
  const [logo, photo] = await Promise.all([
    readFile(join(process.cwd(), "public/images/logo/favicon_fooly.png")),
    readFile(join(process.cwd(), "public/images/banners/home-hero-marketplace-complete.jpg")),
  ]);

  const response = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#fff8ef", color: "#151922" }}>
        <div style={{ width: 700, padding: "48px 52px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <img src={`data:image/png;base64,${logo.toString("base64")}`} width={96} height={96} alt="" style={{ borderRadius: 20 }} />
            <span style={{ fontSize: 26, color: "#ad4800" }}>{siteConfig.slogan}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", fontSize: 66, fontWeight: 700, letterSpacing: -2 }}>{siteConfig.name}</div>
            <div style={{ display: "flex", fontSize: 36, lineHeight: 1.25 }}>Achetez et vendez facilement à Sangarédi</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontSize: 26, color: "#15803d" }}>{siteConfig.location}</span>
            <span style={{ fontSize: 25 }}>www.marchefooly.com</span>
          </div>
        </div>
        <img
          src={`data:image/jpeg;base64,${photo.toString("base64")}`}
          alt=""
          width={500}
          height={630}
          style={{ objectFit: "cover", objectPosition: "30% center", borderLeft: "8px solid #ff7a00" }}
        />
      </div>
    ),
    size,
  );

  // PNG compact pour les aperçus sur connexion mobile ; aucun fichier original modifié.
  const image = await sharp(Buffer.from(await response.arrayBuffer()))
    .png({ compressionLevel: 9, palette: true, quality: 90, colours: 256, effort: 7 })
    .toBuffer();
  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, must-revalidate",
    },
  });
}
