// Direct Client-Side Yandex Disk Cloud Sync for Desktop (.exe) and Static Web Apps
const YANDEX_TOKEN = process.env.NEXT_PUBLIC_YANDEX_DISK_TOKEN || 'y0__wgBEL6E75aq94ACGM7XSyDardinGeBwDdGn_ZMhsB4twfv5dNQZafZa';
const YANDEX_PUBLIC_KEY = 'https://yadi.sk/d/lKAGmi9_P8VH5w';
const YANDEX_FOLDER_PATH = 'disk:/SIES_QMS_Data';
const YANDEX_FILE_PATH = 'disk:/SIES_QMS_Data/sies_store.json';

function sanitizeStore(store: Record<string, any>): Record<string, any> {
  const clean = { ...store };
  delete clean.documents;
  return clean;
}

export async function fetchKeyFromYandexDisk(key: string): Promise<any | null> {
  const fileName = key.endsWith('.json') ? key : `${key}.json`;
  try {
    // 1. Primary: Yandex Public Link REST API (100% CORS, works in all web browsers)
    const pubUrl = 'https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=' + encodeURIComponent(YANDEX_PUBLIC_KEY) + '&path=' + encodeURIComponent('/' + fileName);
    const pubRes = await fetch(pubUrl, { cache: 'no-store' }).catch(() => null);
    if (pubRes && pubRes.ok) {
      const pubData = await pubRes.json().catch(() => null);
      if (pubData && pubData.href) {
        const fileRes = await fetch(pubData.href, { cache: 'no-store' }).catch(() => null);
        if (fileRes && fileRes.ok) {
          return await fileRes.json().catch(() => null);
        }
      }
    }
  } catch (e) {}

  try {
    // 2. Secondary: OAuth API Fallback
    const downloadRes = await fetch(
      'https://cloud-api.yandex.net/v1/disk/resources/download?path=' + encodeURIComponent(`disk:/SIES_QMS_Data/${fileName}`),
      {
        headers: { Authorization: `OAuth ${YANDEX_TOKEN}` },
        cache: 'no-store'
      }
    ).catch(() => null);

    if (downloadRes && downloadRes.ok) {
      const data = await downloadRes.json().catch(() => null);
      if (data && data.href) {
        const contentRes = await fetch(data.href, { cache: 'no-store' }).catch(() => null);
        if (contentRes && contentRes.ok) {
          return await contentRes.json().catch(() => null);
        }
      }
    }
  } catch (e) {}

  return null;
}

export async function saveKeyToYandexDisk(key: string, data: any): Promise<boolean> {
  const fileName = key.endsWith('.json') ? key : `${key}.json`;
  const cleanKey = key.replace('.json', '');
  const filePath = `disk:/SIES_QMS_Data/${fileName}`;

  try {
    let finalPayload = data;

    if (Array.isArray(data)) {
      let existingRemote: any[] = [];
      try {
        const fetched = await fetchKeyFromYandexDisk(cleanKey);
        if (Array.isArray(fetched)) existingRemote = fetched;
      } catch (e) {}

      let deletedOrders: string[] = [];
      try {
        const delFetched = await fetchKeyFromYandexDisk('qms_deleted_orders');
        if (Array.isArray(delFetched)) deletedOrders = delFetched;
      } catch (e) {}

      const deletedSet = new Set<string>(
        deletedOrders
          .filter(s => s && typeof s === 'string' && !s.toLowerCase().trim().startsWith('sies2026'))
          .map(s => s.trim().toLowerCase())
      );

      finalPayload = mergeArrayItems(existingRemote, data, deletedSet);
    }

    const uploadRes = await fetch(
      'https://cloud-api.yandex.net/v1/disk/resources/upload?path=' + encodeURIComponent(filePath) + '&overwrite=true',
      {
        headers: { Authorization: `OAuth ${YANDEX_TOKEN}` },
        cache: 'no-store'
      }
    ).catch(() => null);

    if (uploadRes && uploadRes.ok) {
      const uploadData = await uploadRes.json().catch(() => null);
      if (uploadData && uploadData.href) {
        const putRes = await fetch(uploadData.href, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload),
          cache: 'no-store'
        }).catch(() => null);

        if (putRes && putRes.ok) {
          // Sync with monolithic store as well
          syncMonolithicStore(cleanKey, finalPayload).catch(() => null);
          return true;
        }
      }
    }
  } catch (err) {
    console.error(`Error saving key ${key} to Yandex Disk:`, err);
  }
  return false;
}

async function syncMonolithicStore(key: string, val: any) {
  try {
    let store: Record<string, any> = (await fetchDirectFromYandexDisk()) || {};
    store[key] = val;

    const uploadRes = await fetch(
      'https://cloud-api.yandex.net/v1/disk/resources/upload?path=' + encodeURIComponent(YANDEX_FILE_PATH) + '&overwrite=true',
      {
        headers: { Authorization: `OAuth ${YANDEX_TOKEN}` },
        cache: 'no-store'
      }
    ).catch(() => null);

    if (uploadRes && uploadRes.ok) {
      const data = await uploadRes.json().catch(() => null);
      if (data && data.href) {
        await fetch(data.href, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(store),
          cache: 'no-store'
        }).catch(() => null);
      }
    }
  } catch (e) {}
}

export async function fetchDirectFromYandexDisk(): Promise<Record<string, any> | null> {
  let store: Record<string, any> = {};

  try {
    const pubUrl = 'https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=' + encodeURIComponent(YANDEX_PUBLIC_KEY) + '&path=' + encodeURIComponent('/sies_store.json');
    const pubRes = await fetch(pubUrl, { cache: 'no-store' }).catch(() => null);
    if (pubRes && pubRes.ok) {
      const pubData = await pubRes.json().catch(() => null);
      if (pubData && pubData.href) {
        const fileRes = await fetch(pubData.href, { cache: 'no-store' }).catch(() => null);
        if (fileRes && fileRes.ok) {
          const resJson = await fileRes.json().catch(() => null);
          if (resJson && typeof resJson === 'object') {
            store = sanitizeStore(resJson);
          }
        }
      }
    }
  } catch (err) {}

  // Fallback / Enhancement: Ensure qms_orders is fetched from dedicated file if missing from store
  if (!store.qms_orders || !Array.isArray(store.qms_orders) || store.qms_orders.length === 0) {
    const dedicatedOrders = await fetchKeyFromYandexDisk('qms_orders');
    if (Array.isArray(dedicatedOrders) && dedicatedOrders.length > 0) {
      store.qms_orders = dedicatedOrders;
    }
  }

  return Object.keys(store).length > 0 ? store : null;
}

function getItemWeight(item: any): number {
  if (!item || typeof item !== 'object') return 0;
  let weight = typeof item.updatedAt === 'number' && item.updatedAt > 0 ? item.updatedAt : 0;
  const STATUS_RANKS: Record<string, number> = {
    'SEVK EDİLDİ': 7000000,
    'KISMİ SEVK EDİLDİ': 6000000,
    'PAKETLEMEDE': 5000000,
    'BOYADA': 4000000,
    'KAPLAMADA': 3000000,
    'ÜRETİMDE': 2000000,
    'YENİ SİPARİŞ': 1000000
  };
  const statusWeight = STATUS_RANKS[String(item.status || '').toUpperCase()] || 0;
  const dispatchWeight = Array.isArray(item.dispatches) ? item.dispatches.length * 100000 : 0;
  const historyWeight = Array.isArray(item.history) ? item.history.length * 1000 : 0;
  return weight + statusWeight + dispatchWeight + historyWeight;
}

function mergeArrayItems(remoteArr: any[], incomingArr: any[], deletedSet: Set<string>): any[] {
  const map = new Map<string, any>();

  const processItem = (item: any) => {
    if (!item || typeof item !== 'object') return;
    const itemId = String(item.id || item.code || '').trim().toLowerCase();
    if (!itemId) return;
    if (deletedSet.has(itemId)) return;

    if (!map.has(itemId)) {
      map.set(itemId, item);
    } else {
      const existing = map.get(itemId);
      const existingW = getItemWeight(existing);
      const incomingW = getItemWeight(item);
      if (incomingW >= existingW) {
        map.set(itemId, item);
      }
    }
  };

  (remoteArr || []).forEach(processItem);
  (incomingArr || []).forEach(processItem);

  return Array.from(map.values());
}

export async function saveDirectToYandexDisk(cleanData: Record<string, any>): Promise<boolean> {
  let success = true;
  const keys = Object.keys(cleanData);
  for (const key of keys) {
    const res = await saveKeyToYandexDisk(key, cleanData[key]);
    if (!res) success = false;
  }
  return success;
}
