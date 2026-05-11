import type { Order } from "@/types/order";

export const orders: Order[] = [
  {
    id: "MF-1024",
    date: "2026-05-10",
    itemCount: 2,
    location: "Sangarédi",
    status: "pending",
    total: 1440000,
    currency: "GNF",
    items: [
      {
        name: "Téléphone Samsung A12",
        icon: "bi bi-phone",
        vendor: "Boutique Diallo",
        quantity: 1,
        price: 1200000,
        currency: "GNF",
      },
      {
        name: "Huile de peau naturelle",
        icon: "bi bi-droplet-half",
        vendor: "Beauté Locale",
        quantity: 2,
        price: 120000,
        currency: "GNF",
      },
    ],
    timeline: [
      {
        icon: "bi bi-check-circle-fill",
        label: "Commande passée",
        description: "Votre commande a été enregistrée.",
        state: "done",
      },
      {
        icon: "bi bi-box-seam",
        label: "En préparation",
        description: "Le vendeur prépare votre colis.",
        state: "active",
      },
      {
        icon: "bi bi-truck",
        label: "Livraison",
        description: "En attente d'expédition vers Sangarédi.",
        state: "pending",
      },
    ],
  },
  {
    id: "MF-1018",
    date: "2026-04-28",
    itemCount: 1,
    location: "Sangarédi",
    status: "done",
    total: 500000,
    currency: "GNF",
    items: [
      {
        name: "Télévision écran plat",
        icon: "bi bi-tv",
        vendor: "Électro Sangarédi",
        quantity: 1,
        price: 500000,
        currency: "GNF",
      },
    ],
    timeline: [
      {
        icon: "bi bi-check-circle-fill",
        label: "Commande passée",
        description: "Commande enregistrée le 28 avril.",
        state: "done",
      },
      {
        icon: "bi bi-box-seam",
        label: "En préparation",
        description: "Colis préparé par le vendeur.",
        state: "done",
      },
      {
        icon: "bi bi-truck",
        label: "Livraison",
        description: "Livré avec succès à Sangarédi.",
        state: "done",
      },
    ],
  },
  {
    id: "MF-1009",
    date: "2026-04-15",
    itemCount: 1,
    location: "Sangarédi",
    status: "processing",
    total: 85000,
    currency: "GNF",
    items: [
      {
        name: "Sac tendance femme",
        icon: "bi bi-bag",
        vendor: "Mode Locale",
        quantity: 1,
        price: 85000,
        currency: "GNF",
      },
    ],
    timeline: [
      {
        icon: "bi bi-check-circle-fill",
        label: "Commande passée",
        description: "Commande enregistrée le 15 avril.",
        state: "done",
      },
      {
        icon: "bi bi-box-seam",
        label: "En préparation",
        description: "Vendeur en train de préparer le colis.",
        state: "active",
      },
      {
        icon: "bi bi-truck",
        label: "Livraison",
        description: "Expédition prévue vers Sangarédi.",
        state: "pending",
      },
    ],
  },
];

export const statusLabel: Record<string, string> = {
  pending: "En attente",
  processing: "En cours",
  done: "Livré",
  cancelled: "Annulé",
};

export const statusClass: Record<string, string> = {
  pending: "warning",
  processing: "primary",
  done: "success",
  cancelled: "danger",
};
