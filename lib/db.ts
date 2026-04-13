import { MongoClient, Db, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'hospital_management_system';

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

// Global caching (prevents multiple connections in dev)
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// ==========================
// DB CONNECTION
// ==========================
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// ==========================
// TYPES
// ==========================
interface Counter {
  _id: string;
  seq: number;
}

// ==========================
// ID GENERATOR
// ==========================
export function generateId(prefix: string, number: number): string {
  const padded = number.toString().padStart(6, '0');
  return `${prefix}${padded}`;
}

// ==========================
// GET NEXT SEQUENCE (SAFE)
// ==========================
export async function getNextSequence(db: Db, sequenceName: string): Promise<number> {
  const counters = db.collection<Counter>('counters');

  const result = await counters.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    {
      upsert: true,
      returnDocument: 'after',
    }
  );

  // ✅ Safe optional chaining
  const seq = result?.seq;
  
  if (typeof seq === 'number') {
    return seq;
  }

  // Fallback: fetch directly
  const counter = await counters.findOne({ _id: sequenceName });

  if (counter && typeof counter.seq === 'number') {
    return counter.seq;
  }

  // Final fallback: initialize
  await counters.updateOne(
    { _id: sequenceName },
    { $setOnInsert: { seq: 1 } },
    { upsert: true }
  );

  return 1;
}

// ==========================
// OBJECT ID HELPERS
// ==========================
export function toObjectId(id: string | ObjectId): ObjectId {
  if (id instanceof ObjectId) return id;
  return new ObjectId(id);
}

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

export function toObjectIdSafe(id: string | ObjectId | null | undefined): ObjectId | null {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  if (typeof id === 'string' && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }
  return null;
}

// ==========================
// EXPORT
// ==========================
export { ObjectId };