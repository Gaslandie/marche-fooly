/**
 * Lib: orderStatus (MODULE PUR — importable serveur ET client)
 *
 * Rôle du fichier :
 *   Données et logique d'AFFICHAGE des statuts de commande, sans aucune
 *   I/O :
 *     - `ORDER_STATUS_FLOW` : ordre canonique des statuts actifs.
 *     - `ORDER_STATUS_LABEL` / `ORDER_STATUS_CLASS` : libellés FR + classes
 *       Bootstrap pour les 6 statuts backend.
 *     - `orderStatusLabel()` / `orderStatusClass()` : accès avec fallback.
 *     - `buildOrderTimeline(status)` : timeline d'affichage PURE et
 *       déterministe dérivée d'un statut.
 *
 * Pourquoi un fichier séparé de `lib/orders.ts` :
 *   `lib/orders.ts` importe `lib/auth` (-> `next/headers`), il est donc
 *   SERVEUR UNIQUEMENT. Ces helpers-ci sont PURS : on les isole pour
 *   pouvoir les importer depuis des Client Components (OrderCard,
 *   OrdersHistory) SANS tirer de code serveur dans le bundle navigateur.
 *
 * Où il est utilisé :
 *   - components/orders/OrderCard.tsx, OrdersToolbar.tsx, OrdersHistory.tsx
 *   - app/commandes/page.tsx, app/commande/[reference]/page.tsx
 *   - futur espace vendeur/admin (mêmes statuts).
 *
 * Note pour GitHub Copilot :
 *   - 6 statuts backend : pending, confirmed, preparing, shipped,
 *     delivered, cancelled.
 *   - `buildOrderTimeline` : même entrée -> même sortie, aucun effet de bord.
 */

import type { TimelineStep } from "@/types/order";

/** Ordre canonique des statuts « actifs » (hors annulation). */
export const ORDER_STATUS_FLOW = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
] as const;

/**
 * Transition de statut proposable à un VENDEUR depuis l'UI.
 * `intent` sert seulement à la présentation (couleur du bouton).
 */
export type SellerStatusTransition = {
  target: string;
  label: string;
  intent: "advance" | "cancel";
};

/**
 * Miroir FRONTEND de la machine d'état backend (acteur = seller).
 * Source de vérité = backend (STATUS_TRANSITIONS dans orderController).
 * Ce miroir sert UNIQUEMENT à n'afficher que les boutons autorisés ;
 * le backend revérifie et reste juge final (422 si transition interdite,
 * 403 si l'acteur n'est pas autorisé).
 */
const SELLER_TRANSITIONS: Record<string, SellerStatusTransition[]> = {
  pending: [
    { target: "confirmed", label: "Confirmer", intent: "advance" },
    { target: "cancelled", label: "Annuler", intent: "cancel" },
  ],
  confirmed: [
    { target: "preparing", label: "Mettre en préparation", intent: "advance" },
    { target: "cancelled", label: "Annuler", intent: "cancel" },
  ],
  preparing: [
    { target: "shipped", label: "Expédier", intent: "advance" },
    { target: "cancelled", label: "Annuler", intent: "cancel" },
  ],
  shipped: [
    { target: "delivered", label: "Marquer comme livrée", intent: "advance" },
  ],
  delivered: [],
  cancelled: [],
};

/**
 * Transitions de statut autorisées à un vendeur depuis un statut donné.
 * PURE. Renvoie `[]` pour les états terminaux ou inconnus.
 */
export function getSellerStatusTransitions(
  status: string,
): SellerStatusTransition[] {
  return SELLER_TRANSITIONS[status] ?? [];
}

/** Libellés français des 6 statuts backend. */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

/** Classes de couleur Bootstrap (`bg-<classe>`) par statut. */
export const ORDER_STATUS_CLASS: Record<string, string> = {
  pending: "warning",
  confirmed: "info",
  preparing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "danger",
};

/** Libellé d'un statut (fallback = code brut si inconnu). */
export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status;
}

/** Classe Bootstrap d'un statut (fallback neutre si inconnu). */
export function orderStatusClass(status: string): string {
  return ORDER_STATUS_CLASS[status] ?? "secondary";
}

// Métadonnées d'affichage de chaque étape du flux actif.
const FLOW_STEPS: Record<
  (typeof ORDER_STATUS_FLOW)[number],
  { icon: string; label: string; description: string }
> = {
  pending: {
    icon: "bi bi-check-circle-fill",
    label: "Commande passée",
    description: "Votre commande a été enregistrée.",
  },
  confirmed: {
    icon: "bi bi-clipboard-check",
    label: "Confirmée",
    description: "Le vendeur a confirmé votre commande.",
  },
  preparing: {
    icon: "bi bi-box-seam",
    label: "En préparation",
    description: "Le vendeur prépare votre colis.",
  },
  shipped: {
    icon: "bi bi-truck",
    label: "Expédiée",
    description: "Votre commande est en route.",
  },
  delivered: {
    icon: "bi bi-house-check",
    label: "Livrée",
    description: "Commande livrée. Merci de votre confiance !",
  },
};

/**
 * Construit une timeline d'affichage à partir d'un statut de commande.
 * PURE et déterministe : aucune I/O, même entrée -> même sortie.
 *
 * - Statut « actif » : les étapes avant le statut courant sont `done`,
 *   l'étape courante est `active` (ou `done` si delivered), les suivantes
 *   sont `pending`.
 * - Statut « cancelled » : timeline dédiée (passée -> annulée).
 */
export function buildOrderTimeline(status: string): TimelineStep[] {
  if (status === "cancelled") {
    return [
      {
        icon: "bi bi-check-circle-fill",
        label: "Commande passée",
        description: "Votre commande avait été enregistrée.",
        state: "done",
      },
      {
        icon: "bi bi-x-circle-fill",
        label: "Annulée",
        description: "Cette commande a été annulée.",
        state: "active",
      },
    ];
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(
    status as (typeof ORDER_STATUS_FLOW)[number],
  );
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const isDelivered = status === "delivered";

  return ORDER_STATUS_FLOW.map((step, index) => {
    const meta = FLOW_STEPS[step];
    let state: TimelineStep["state"];
    if (index < safeIndex) {
      state = "done";
    } else if (index === safeIndex) {
      state = isDelivered ? "done" : "active";
    } else {
      state = "pending";
    }
    return { ...meta, state };
  });
}
