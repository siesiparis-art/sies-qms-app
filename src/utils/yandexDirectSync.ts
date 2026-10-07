const RESTFUL_OBJECT_ID = 'ff808181a09d98f701a114d9ec5c119d';
const RESTFUL_API_URL = `https://api.restful-api.dev/objects/${RESTFUL_OBJECT_ID}`;

function sanitizeStore(store: Record<string, any>): Record<string, any> {
  const clean = { ...store };
  delete clean.documents;
  return clean;
}

export async function fetchDirectFromYandexDisk(): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(RESTFUL_API_URL, { cache: 'no-store' }).catch(() => null);
    if (res && res.ok) {
      const body = await res.json().catch(() => null);
      if (body && body.data && typeof body.data === 'object') {
        return sanitizeStore(body.data);
      }
    }
  } catch (err) {
    console.error('Direct Cloud Fetch Error:', err);
  }
  return null;
}

export async function saveDirectToYandexDisk(cleanData: Record<string, any>): Promise<boolean> {
  try {
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
      if (Array.isArray(incomingVal)) {
        if (incomingVal.length > 0 || !mergedStore[key]) {
          mergedStore[key] = incomingVal;
        }
      } else if (incomingVal !== undefined && incomingVal !== null) {
        mergedStore[key] = incomingVal;
      }
    });

    const payload = {
      name: 'SIES_GLOBAL_POOL',
      data: mergedStore
    };

    const putRes = await fetch(RESTFUL_API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    }).catch(() => null);

    if (putRes && putRes.ok) {
      return true;
    }
  } catch (err) {
    console.error('Direct Cloud Save Error:', err);
  }
  return false;
}
