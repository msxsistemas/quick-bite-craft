// Utilities to persist and broadcast the store status mode (manual vs automatic)

export type StoreManualModeChangeDetail = {
  restaurantId: string;
  manual: boolean;
};

const STORE_MANUAL_MODE_EVENT = 'store-manual-mode-changed' as const;

const manualModeKey = (restaurantId: string) => `store_manual_mode:${restaurantId}`;

export const getStoreManualMode = (restaurantId?: string | null): boolean => {
  if (!restaurantId) return false;
  try {
    const raw = localStorage.getItem(manualModeKey(restaurantId));
    if (raw === null) return false;
    return JSON.parse(raw) === true;
  } catch {
    return false;
  }
};

export const setStoreManualMode = (restaurantId: string, manual: boolean) => {
  localStorage.setItem(manualModeKey(restaurantId), JSON.stringify(manual));
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
