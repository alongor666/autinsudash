import { RawDataRow } from './types';

const DB_NAME = 'CarInsuranceDB';
const DB_VERSION = 1;
const STORE_NAME = 'rawData';
const DATA_KEY = 'currentData';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject('Error opening IndexedDB.');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function storeData(data: RawDataRow[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, DATA_KEY);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject('Error storing data in IndexedDB.');
    };
  });
}

export async function getData(): Promise<RawDataRow[] | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(DATA_KEY);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject('Error retrieving data from IndexedDB.');
    };
  });
}
