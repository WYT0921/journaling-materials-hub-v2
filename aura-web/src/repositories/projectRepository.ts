import type { AuraProject } from '../types/aura'

const DB_NAME = 'aura-music-web'
const DB_VERSION = 1
const PROJECTS = 'projects'
const FILES = 'files'

function openAuraDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(FILES)) db.createObjectStore(FILES)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export class ProjectRepository {
  async list(): Promise<AuraProject[]> {
    const db = await openAuraDb()
    const rows = await requestResult(db.transaction(PROJECTS).objectStore(PROJECTS).getAll()) as AuraProject[]
    db.close()
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async save(project: AuraProject): Promise<void> {
    const db = await openAuraDb()
    const transaction = db.transaction(PROJECTS, 'readwrite')
    transaction.objectStore(PROJECTS).put(JSON.parse(JSON.stringify(project)) as AuraProject)
    await transactionDone(transaction)
    db.close()
  }

  async putPhoto(projectId: string, blob: Blob): Promise<string> {
    const key = `${projectId}:photo`
    const db = await openAuraDb()
    const transaction = db.transaction(FILES, 'readwrite')
    transaction.objectStore(FILES).put(blob, key)
    await transactionDone(transaction)
    db.close()
    return key
  }

  async getPhoto(key?: string): Promise<Blob | undefined> {
    if (!key) return undefined
    const db = await openAuraDb()
    const result = await requestResult(db.transaction(FILES).objectStore(FILES).get(key)) as Blob | undefined
    db.close()
    return result
  }

  async delete(project: AuraProject): Promise<void> {
    const db = await openAuraDb()
    const transaction = db.transaction([PROJECTS, FILES], 'readwrite')
    transaction.objectStore(PROJECTS).delete(project.id)
    if (project.photoKey) transaction.objectStore(FILES).delete(project.photoKey)
    await transactionDone(transaction)
    db.close()
  }
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
