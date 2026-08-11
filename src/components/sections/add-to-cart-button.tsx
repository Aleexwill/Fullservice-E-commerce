'use client';

import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/lib/cart-store';

interface AddToCartButtonProps {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  stock: number;
  className?: string;
}

export function AddToCartButton({ className, ...product }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <button
      className={className || 'btn-primary mt-3 w-full text-[0.65rem]'}
      disabled={product.stock === 0}
      onClick={() => {
        addItem(product);
        toast.success(`${product.name} agregado al carrito`);
      }}
    >
      <ShoppingCart className="h-3.5 w-3.5" />
      {product.stock > 0 ? 'Agregar' : 'Sin stock'}
    </button>
  );
}
