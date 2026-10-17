import { cache } from "react";
import { hasBackOfficeAccess } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { getMySellerProfile } from "@/lib/seller";
import type { AuthUser } from "@/types/auth";
import type { SellerCtaStatus } from "@/lib/sellerCta";

export type SellerNavigationState = {
  user: AuthUser | null;
  sellerStatus: SellerCtaStatus;
  showSellerEntry: boolean;
};

// Mémoïsation limitée au rendu courant, jamais partagée entre deux comptes.
export const getSellerNavigationState = cache(async (): Promise<SellerNavigationState> => {
  const [user, sellerProfile] = await Promise.all([
    getCurrentUser(),
    getMySellerProfile(),
  ]);
  const isBackOfficeUser = user ? hasBackOfficeAccess(user.role) : false;
  const sellerStatus = isBackOfficeUser ? null : sellerProfile?.status ?? null;
  const showSellerEntry = !isBackOfficeUser;

  return {
    user,
    sellerStatus,
    showSellerEntry,
  };
});
