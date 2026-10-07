"use client";

import type { ReactNode } from "react";
import { useCart } from "@/components/cart/CartProvider";

export default function CartNotEmpty({ children }: { children: ReactNode }) {
  const { lines } = useCart();

  return lines.length > 0 ? children : null;
}
