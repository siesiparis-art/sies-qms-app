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

export async function fetchDirectFromYandexDisk(): Promise<Record<string, any> | null> {
  try {
    // 1. Primary: Yandex Public Link REST API (100% CORS, 0% Token error, works in all web browsers)
    const pubUrl = 'https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=' + encodeURIComponent(YANDEX_PUBLIC_KEY) + '&path=' + encodeURIComponent('/sies_store.json');
    const pubRes = await fetch(pubUrl, { cache: 'no-store' }).catch(() => null);
    if (pubRes && pubRes.ok) {
      const pubData = await pubRes.json().catch(() => null);
      if (pubData && pubData.href) {
        const fileRes = await fetch(pubData.href, { cache: 'no-store' }).catch(() => null);
        if (fileRes && fileRes.ok) {
          const store = await fileRes.json().catch(() => null);
          if (store && typeof store === 'object') {
            return sanitizeStore(store);
          }
        }
      }
    }
  } catch (err) {
    console.error('Yandex Public Fetch Error:', err);
  }

  try {
    // 2. Secondary: Direct OAuth API Fallback
    const downloadRes = await fetch(
      'https://cloud-api.yandex.net/v1/disk/resources/download?path=' + encodeURIComponent(YANDEX_FILE_PATH),
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
          const store = await contentRes.json().catch(() => null);
          if (store && typeof store === 'object') {
            return sanitizeStore(store);
          }
        }
      }
    }
  } catch (err) {}

  return null;
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
  try {
    // 1. Fetch current remote store to safely merge
    let remoteStore: Record<string, any> = {};
    try {
      const existing = await fetchDirectFromYandexDisk();
      if (existing && typeof existing === 'object') {
        remoteStore = existing;
      }
    } catch (e) {}

    // Extract deleted items sets
    const deletedOrders: string[] = [
      ...(Array.isArray(remoteStore.qms_deleted_orders) ? remoteStore.qms_deleted_orders : []),
      ...(Array.isArray(cleanData.qms_deleted_orders) ? cleanData.qms_deleted_orders : [])
    ];
    const deletedSet = new Set<string>(
      deletedOrders
        .filter(s => s && typeof s === 'string' && !s.toLowerCase().trim().startsWith('sies2026'))
        .map(s => s.trim().toLowerCase())
    );

    // 2. Merge incoming data into remote store
    const mergedStore: Record<string, any> = { ...remoteStore };
    Object.keys(cleanData).forEach(key => {
      const incomingVal = cleanData[key];
      const remoteVal = remoteStore[key];

      if (Array.isArray(incomingVal)) {
        if (Array.isArray(remoteVal) && remoteVal.length > 0) {
          mergedStore[key] = mergeArrayItems(remoteVal, incomingVal, deletedSet);
        } else {
          mergedStore[key] = incomingVal.filter(item => {
            if (!item || typeof item !== 'object') return true;
            const itemId = String(item.id || item.code || '').trim().toLowerCase();
            return !itemId || !deletedSet.has(itemId);
          });
        }
      } else if (incomingVal !== undefined && incomingVal !== null) {
        mergedStore[key] = incomingVal;
      }
    });

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
        const putRes = await fetch(data.href, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mergedStore),
          cache: 'no-store'
        }).catch(() => null);

        if (putRes && putRes.ok) {
          return true;
        }
      }
    }
  } catch (err) {
    console.error('Direct Yandex Save Error:', err);
  }
  return false;
}

