/**
 * Global Cart Event Dispatcher & State Listener
 * Allows seamless communication between ProductCard, Details page, and FloatingCartBar
 */

export interface CartEventPayload {
  product?: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
  };
  cart?: {
    item_count?: number;
    subtotal?: number;
    total?: number;
    items?: any[];
  };
  action?: 'add' | 'remove' | 'update' | 'clear' | 'refresh';
}

const CART_UPDATED_EVENT = 'mk:cart-updated';

export function dispatchCartUpdated(detail?: CartEventPayload) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent<CartEventPayload>(CART_UPDATED_EVENT, {
      detail: detail || {},
    });
    window.dispatchEvent(event);
  }
}

export function subscribeToCartUpdates(callback: (payload: CartEventPayload) => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<CartEventPayload>;
    callback(customEvent.detail || {});
  };

  window.addEventListener(CART_UPDATED_EVENT, handler);
  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, handler);
  };
}
