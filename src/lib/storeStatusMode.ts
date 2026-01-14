// Utilities to broadcast the store status mode (manual vs automatic) changes within the app
// The mode is now stored in the database (restaurants.is_manual_mode), this module just broadcasts changes across open tabs

export type StoreManualModeChangeDetail = {
  restaurantId: string;
  manual: boolean;
};

const STORE_MANUAL_MODE_EVENT = 'store-manual-mode-changed' as const;

export const broadcastStoreManualModeChange = (restaurantId: string, manual: boolean) => {
  window.dispatchEvent(
    new CustomEvent<StoreManualModeChangeDetail>(STORE_MANUAL_MODE_EVENT, {
      detail: { restaurantId, manual },
    })
  );
};

export const subscribeStoreManualMode = (
  handler: (detail: StoreManualModeChangeDetail) => void
) => {
  const listener = (event: Event) => {
    const e = event as CustomEvent<StoreManualModeChangeDetail>;
    if (!e?.detail) return;
    handler(e.detail);
  };

  window.addEventListener(STORE_MANUAL_MODE_EVENT, listener);
  return () => window.removeEventListener(STORE_MANUAL_MODE_EVENT, listener);
};
