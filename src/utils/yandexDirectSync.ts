// Direct Client-Side Yandex Disk Cloud Sync for Desktop (.exe) and Static Web Apps
const YANDEX_TOKEN = process.env.NEXT_PUBLIC_YANDEX_DISK_TOKEN || 'y0__wgBEL6E75aq94ACGM7XSyDardinGeBwDdGn_ZMhsB4twfv5dNQZafZa';
const YANDEX_FOLDER_PATH = 'disk:/SIES_QMS_Data';
const YANDEX_FILE_PATH = 'disk:/SIES_QMS_Data/sies_store.json';

function sanitizeStore(store: Record<string, any>): Record<string, any> {
  const clean = { ...store };
  delete clean.documents;
  return clean;
}

async function ensureYandexFolder(): Promise<void> {
  try {
    await fetch('https://cloud-api.yandex.net/v1/disk/resources?path=' + encodeURIComponent(YANDEX_FOLDER_PATH), {
      method: 'PUT',
      headers: { Authorization: `OAuth ${YANDEX_TOKEN}` },
      cache: 'no-store'
    }).catch(() => null);
  } catch (e) {
    // Ignore
  }
}

export async function fetchDirectFromYandexDisk(): Promise<Record<string, any> | null> {
  try {
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
  } catch (err) {
    console.error('Direct Yandex Disk Fetch Error:', err);
  }
  return null;
}

export async function saveDirectToYandexDisk(cleanData: Record<string, any>): Promise<boolean> {
  try {
    await ensureYandexFolder();

    // 1. Fetch current remote store to prevent overwriting missing keys
    let remoteStore: Record<string, any> = {};
    try {
      const existing = await fetchDirectFromYandexDisk();
      if (existing && typeof existing === 'object') {
        remoteStore = existing;
      }
    } catch (e) {}

    // 2. Safely merge incoming data into remote store
    const mergedStore: Record<string, any> = { ...remoteStore };
    Object.keys(cleanData).forEach(key => {
      const incomingVal = cleanData[key];
      // Only update key if incomingVal is valid or non-empty array
      if (Array.isArray(incomingVal)) {
        if (incomingVal.length > 0 || !mergedStore[key]) {
          mergedStore[key] = incomingVal;
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
    console.error('Direct Yandex Disk Save Error:', err);
  }
  return false;
}
