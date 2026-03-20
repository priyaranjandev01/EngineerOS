import { openDB, type IDBPDatabase } from 'idb';
import type { EngineerEntity, DailyMission, Issue, Learning, Improvement, StickyNote } from './types';

const DB_NAME = 'engineeros';
const DB_VERSION = 1;

const STORES = {
  missions: 'missions',
  issues: 'issues',
  learnings: 'learnings',
  improvements: 'improvements',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of Object.values(STORES)) {
          if (!db.objectStoreNames.contains(store)) {
            const s = db.createObjectStore(store, { keyPath: 'id' });
            s.createIndex('createdAt', 'createdAt');
            s.createIndex('updatedAt', 'updatedAt');
          }
        }
      },
    });
  }
  return dbPromise;
}

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const DB = {
  async getAll<T extends EngineerEntity>(store: StoreName): Promise<T[]> {
    const db = await getDB();
    const items = await db.getAll(store);
    return (items as T[]).sort((a, b) => b.createdAt - a.createdAt);
  },

  async get<T extends EngineerEntity>(store: StoreName, id: string): Promise<T | undefined> {
    const db = await getDB();
    return db.get(store, id) as Promise<T | undefined>;
  },

  async save<T extends EngineerEntity>(store: StoreName, data: Partial<T> & { id?: string }): Promise<T> {
    const db = await getDB();
    const now = Date.now();
    const entity = {
      ...data,
      id: data.id || generateId(),
      createdAt: data.createdAt || now,
      updatedAt: now,
    } as T;
    await db.put(store, entity);
    return entity;
  },

  async delete(store: StoreName, id: string): Promise<void> {
    const db = await getDB();
    await db.delete(store, id);
  },

  async search(query: string): Promise<{ type: StoreName; item: EngineerEntity }[]> {
    const q = query.toLowerCase();
    const results: { type: StoreName; item: EngineerEntity }[] = [];

    for (const store of Object.values(STORES)) {
      const items = await this.getAll(store);
      for (const item of items) {
        const text = JSON.stringify(item).toLowerCase();
        if (text.includes(q)) {
          results.push({ type: store, item });
        }
      }
    }
    return results.sort((a, b) => b.item.updatedAt - a.item.updatedAt);
  },

  // Convenience accessors
  missions: {
    getAll: () => DB.getAll<DailyMission>('missions'),
    get: (id: string) => DB.get<DailyMission>('missions', id),
    save: (data: Partial<DailyMission>) => DB.save<DailyMission>('missions', data),
    delete: (id: string) => DB.delete('missions', id),
  },
  issues: {
    getAll: () => DB.getAll<Issue>('issues'),
    get: (id: string) => DB.get<Issue>('issues', id),
    save: (data: Partial<Issue>) => DB.save<Issue>('issues', data),
    delete: (id: string) => DB.delete('issues', id),
  },
  learnings: {
    getAll: () => DB.getAll<Learning>('learnings'),
    get: (id: string) => DB.get<Learning>('learnings', id),
    save: (data: Partial<Learning>) => DB.save<Learning>('learnings', data),
    delete: (id: string) => DB.delete('learnings', id),
  },
  improvements: {
    getAll: () => DB.getAll<Improvement>('improvements'),
    get: (id: string) => DB.get<Improvement>('improvements', id),
    save: (data: Partial<Improvement>) => DB.save<Improvement>('improvements', data),
    delete: (id: string) => DB.delete('improvements', id),
  },
};
