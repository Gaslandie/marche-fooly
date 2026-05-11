export type OrderStatus = "pending" | "processing" | "done" | "cancelled";

export type TimelineState = "done" | "active" | "pending";

export type TimelineStep = {
  icon: string;
  label: string;
  description: string;
  state: TimelineState;
};

export type OrderItem = {
  name: string;
  icon: string;
  vendor: string;
  quantity: number;
  price: number;
  currency: string;
};

export type Order = {
  id: string;
  date: string;
  itemCount: number;
  location: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  currency: string;
  timeline: TimelineStep[];
};
