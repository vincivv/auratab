import { openDB, type IDBPDatabase } from 'idb'

const DB_NAME = 'auratab-backgrounds'
const STORE_NAME = 'media'
/** Single-slot key — MVP is "one active custom background," uploading a new one replaces it, not a gallery of saved uploads. */
const CUSTOM_KEY = 'custom-background'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME)
      },
    })
  }
  return dbPromise
}

export async function saveCustomBackground(blob: Blob): Promise<void> {
  const db = await getDb()
  await db.put(STORE_NAME, blob, CUSTOM_KEY)
}

export async function loadCustomBackground(): Promise<Blob | undefined> {
  const db = await getDb()
  return db.get(STORE_NAME, CUSTOM_KEY)
}

export async function clearCustomBackground(): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, CUSTOM_KEY)
}
