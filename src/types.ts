export type Role = "Artisan" | "Customer";

export interface Variation {
  id: string;
  type: string; // e.g., "Color", "Size"
  value: string; // e.g., "Red", "Small"
  stock: number;
  priceAdjustment: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  artisanId: string;
  image: string;
  rating?: number;
  bestSelling?: boolean;
  variations?: Variation[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  followedArtisans?: string[];
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: "Placed" | "Shipped" | "Delivered";
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariationId?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
