/**
 * Route Handler: POST /api/sellers/apply (interne Next.js — BFF)
 *
 * Reçoit la demande vendeur du navigateur et la transmet au backend
 * Express avec le JWT lu dans le cookie httpOnly. Le token n'est jamais
 * exposé au navigateur.
 */

import { NextResponse } from "next/server";
import { backendJson, readAuthToken } from "@/lib/auth";

type BackendSellerBody = {
  message?: string;
  data?: { sellerProfile?: unknown };
};

function sanitizeSellerApplication(raw: unknown): Record<string, unknown> {
  const input =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const payload: Record<string, unknown> = {};
  const storeName = input.storeName;
  const description = input.description;
  const contactDetails = input.contactDetails;
  const address = input.address;

  if (typeof storeName === "string") payload.storeName = storeName.trim();
  if (typeof description === "string") payload.description = description.trim();
  if (contactDetails && typeof contactDetails === "object") {
    payload.contactDetails = contactDetails;
  }
  if (address && typeof address === "object") payload.address = address;

  return payload;
}

export async function POST(request: Request) {
  const token = await readAuthToken();
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Connectez-vous avant de créer une boutique vendeur.",
        sellerProfile: null,
      },
      { status: 401 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Requête invalide", sellerProfile: null },
      { status: 400 },
    );
  }

  const payload = sanitizeSellerApplication(raw);

  let result: { status: number; ok: boolean; body: unknown };
  try {
    result = await backendJson("/api/sellers/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service vendeur indisponible. Réessayez plus tard.",
        sellerProfile: null,
      },
      { status: 503 },
    );
  }

  const body = result.body as BackendSellerBody | null;
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: body?.message ?? "Création de boutique impossible",
        sellerProfile: null,
      },
      { status: result.status },
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: body?.message ?? "Candidature vendeur enregistrée",
      sellerProfile: body?.data?.sellerProfile ?? null,
    },
    { status: 201 },
  );
}
