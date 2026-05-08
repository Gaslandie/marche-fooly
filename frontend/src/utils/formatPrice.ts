export function formatPrice(price: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR").format(price)} ${currency}`;
}
