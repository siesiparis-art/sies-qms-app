// Direct Client-Side Yandex Disk Cloud Sync for Desktop (.exe) and Static Web Apps
const YANDEX_TOKEN = process.env.NEXT_PUBLIC_YANDEX_DISK_TOKEN || 'y0__wgBEL6E75aq94ACGM7XSyDardinGeBwDdGn_ZMhsB4twfv5dNQZafZa';
const YANDEX_PUBLIC_KEY = 'https://yadi.sk/d/lKAGmi9_P8VH5w';
const YANDEX_FOLDER_PATH = 'disk:/SIES_QMS_Data';
const YANDEX_FILE_PATH = 'disk:/SIES_QMS_Data/sies_store.json';

function sanitizeStore(store: Record<string, any>): Record<string, any> {
  const clean = { ...store };
  delete clean.documents;
  delete clean.qms_orders; // Single source of truth is disk:/SIES_QMS_Data/qms_orders.json
  return clean;
}

// In-memory cache for pre-signed S3 download URLs to prevent rate-limiting and accelerate fetch speed
const hrefCache: Record<string, { href: string; expiresAt: number }> = {};

export async function fetchKeyFromYandexDisk(key: string): Promise<any | null> {
  const fileName = key.endsWith('.json') ? key : `${key}.json`;
  const now = Date.now();
  
  // 1. Check in-memory href cache first (valid for 12 seconds)
  let downloadHref = hrefCache[fileName]?.expiresAt > now ? hrefCache[fileName].href : null;

  if (!downloadHref) {
    try {
      const downloadRes = await fetch(
        `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(`disk:/SIES_QMS_Data/${fileName}`)}`,
        {
          headers: { Authorization: `OAuth ${YANDEX_TOKEN}` },
          cache: 'no-store'
        }
      ).catch(() => null);

      if (downloadRes && downloadRes.ok) {
        const data = await downloadRes.json().catch(() => null);
        if (data && data.href) {
          downloadHref = data.href;
          hrefCache[fileName] = { href: data.href, expiresAt: now + 12000 };
        }
      }
    } catch (e) {}
  }

  if (downloadHref) {
    try {
      const contentRes = await fetch(downloadHref, { cache: 'no-store' }).catch(() => null);
      if (contentRes && contentRes.ok) {
        return await contentRes.json().catch(() => null);
      } else if (contentRes && (contentRes.status === 403 || contentRes.status === 410)) {
        // Expired S3 signature, invalidate cache
        delete hrefCache[fileName];
      }
    } catch (e) {}
  }

  // 2. Secondary: Public Link REST API Fallback
  try {
    const pubUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(YANDEX_PUBLIC_KEY)}&path=${encodeURIComponent('/' + fileName)}`;
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

  return null;
}

export async function saveKeyToYandexDisk(key: string, data: any, isDirectSave = false): Promise<boolean> {
  const fileName = key.endsWith('.json') ? key : `${key}.json`;
  const cleanKey = key.replace('.json', '');
  const filePath = `disk:/SIES_QMS_Data/${fileName}`;

  // Invalidate href cache for modified file
  delete hrefCache[fileName];
  if (cleanKey === 'qms_orders') {
    delete hrefCache['qms_deleted_orders.json'];
  }

  try {
    let finalPayload = data;

    // Sanitize any array data to strip Base64 strings before cloud upload
    if (Array.isArray(data)) {
      finalPayload = data.map(item => {
        if (item && typeof item === 'object') {
          const copy = { ...item };
          if (copy.attachedFileLink && typeof copy.attachedFileLink === 'string' && copy.attachedFileLink.startsWith('data:')) {
            copy.attachedFileLink = 'db://pdf_file_att_' + copy.id;
          }
          if (copy.originalFileUrl && typeof copy.originalFileUrl === 'string' && copy.originalFileUrl.startsWith('data:')) {
            copy.originalFileUrl = 'db://pdf_file_orig_' + copy.id;
          }
          if (copy.pdfFile && typeof copy.pdfFile === 'string' && copy.pdfFile.startsWith('data:')) {
            copy.pdfFile = 'db://pdf_file_run_' + copy.id;
          }
          if (copy.pdfFileUrl && typeof copy.pdfFileUrl === 'string' && copy.pdfFileUrl.startsWith('data:')) {
            copy.pdfFileUrl = 'db://pdf_file_dev_' + copy.id;
          }
          return copy;
        }
        return item;
      });
    }

    if (cleanKey === 'qms_orders' && Array.isArray(finalPayload)) {
      let existingRemote: any[] = [];
      let remoteDeleted: string[] = [];
      try {
        const fetchedOrders = await fetchKeyFromYandexDisk('qms_orders');
        if (Array.isArray(fetchedOrders)) existingRemote = fetchedOrders;
        const fetchedDel = await fetchKeyFromYandexDisk('qms_deleted_orders');
        if (Array.isArray(fetchedDel)) remoteDeleted = fetchedDel;
      } catch (e) {}

      const allDeletedSet = new Set(remoteDeleted.map(s => String(s).toLowerCase().trim()));

      if (isDirectSave) {
        // Direct save: filter out tombstones from finalPayload
        finalPayload = finalPayload.filter(o => o && o.id && !allDeletedSet.has(String(o.id).toLowerCase().trim()) && (!o.customerOrderNo || !allDeletedSet.has(String(o.customerOrderNo).toLowerCase().trim())));
      } else {
        // Merge with existing remote, filtering out tombstones
        const merged = mergeArrayItems(existingRemote, finalPayload);
        finalPayload = merged.filter(o => o && o.id && !allDeletedSet.has(String(o.id).toLowerCase().trim()) && (!o.customerOrderNo || !allDeletedSet.has(String(o.customerOrderNo).toLowerCase().trim())));
      }

      if (finalPayload.length === 0 && allDeletedSet.size === 0) {
        console.warn('[yandexDirectSync] Blocked saving empty orders list to cloud!');
        return false;
      }
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
          if (cleanKey !== 'qms_orders') {
            syncMonolithicStore(cleanKey, finalPayload).catch(() => null);
          }
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
    const [dedicatedOrders, delOrders, resStore] = await Promise.all([
      fetchKeyFromYandexDisk('qms_orders'),
      fetchKeyFromYandexDisk('qms_deleted_orders'),
      fetchKeyFromYandexDisk('sies_store')
    ]);

    if (Array.isArray(dedicatedOrders)) {
      store.qms_orders = dedicatedOrders;
    }
    if (Array.isArray(delOrders)) {
      store.qms_deleted_orders = delOrders;
    }
    if (resStore && typeof resStore === 'object') {
      const cleanStore = sanitizeStore(resStore);
      store = { ...cleanStore, ...store };
    }
  } catch (err) {}

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

function mergeArrayItems(remoteArr: any[], incomingArr: any[]): any[] {
  const map = new Map<string, any>();

  const processItem = (item: any) => {
    if (!item || typeof item !== 'object') return;
    const itemId = String(item.id || item.code || '').trim().toLowerCase();
    if (!itemId) return;

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

export async function saveDirectToYandexDisk(cleanData: Record<string, any>, isDirectSave = false): Promise<boolean> {
  let success = true;
  const keys = Object.keys(cleanData);
  for (const key of keys) {
    const res = await saveKeyToYandexDisk(key, cleanData[key], isDirectSave);
    if (!res) success = false;
  }
  return success;
}
