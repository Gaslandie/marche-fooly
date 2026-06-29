export type SellerCtaStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | null
  | undefined;

export type SellerCta = {
  href: string;
  label: string;
  icon: string;
};

type SellerCtaOptions = {
  defaultLabel?: string;
};

export function getSellerCta(
  status: SellerCtaStatus,
  options: SellerCtaOptions = {},
): SellerCta {
  if (status === "approved") {
    return {
      href: "/vendeur",
      label: "Espace vendeur",
      icon: "bi bi-shop",
    };
  }

  if (status === "pending") {
    return {
      href: "/vendeur",
      label: "Demande en attente",
      icon: "bi bi-hourglass-split",
    };
  }

  if (status === "rejected") {
    return {
      href: "/vendeur",
      label: "Voir ma demande",
      icon: "bi bi-x-octagon",
    };
  }

  if (status === "suspended") {
    return {
      href: "/vendeur",
      label: "Boutique suspendue",
      icon: "bi bi-pause-circle",
    };
  }

  return {
    href: "/devenir-vendeur",
    label: options.defaultLabel ?? "Devenir vendeur",
    icon: "bi bi-shop",
  };
}

export function hasSellerProfileStatus(status: SellerCtaStatus): boolean {
  return (
    status === "pending" ||
    status === "approved" ||
    status === "rejected" ||
    status === "suspended"
  );
}
