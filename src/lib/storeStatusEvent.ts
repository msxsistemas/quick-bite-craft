// Event to broadcast store status changes within the same browser tab/window

export type StoreStatusChangeDetail = {
  restaurantId: string;
  isOpen: boolean;
};

const STORE_STATUS_EVENT = 'store-status-changed' as const;

export const broadcastStoreStatusChange = (restaurantId: string, isOpen: boolean) => {
  window.dispatchEvent(
    new CustomEvent<StoreStatusChangeDetail>(STORE_STATUS_EVENT, {
      detail: { restaurantId, isOpen },
    })
  );
};

export const subscribeStoreStatus = (
  handler: (detail: StoreStatusChangeDetail) => void
) => {
  const listener = (event: Event) => {
    const e = event as CustomEvent<StoreStatusChangeDetail>;
    if (!e?.detail) return;
    handler(e.detail);
  };

  window.addEventListener(STORE_STATUS_EVENT, listener);
  return () => window.removeEventListener(STORE_STATUS_EVENT, listener);
};
