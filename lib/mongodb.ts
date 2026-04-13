import { MongoClient, Db, MongoClientOptions, ObjectId, Collection } from 'mongodb';

// ==========================
// GLOBAL CACHE
// ==========================
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// ==========================
// ENV
// ==========================
const MONGODB_URI: string = process.env.MONGODB_URI as string;
const MONGODB_DB: string = process.env.MONGODB_DB || 'hospital_management_system';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// ==========================
// TYPES
// ==========================
interface Counter {
  _id: string;   // ✅ IMPORTANT: string, not ObjectId
  seq: number;
}

// ==========================
// DB CONNECTION
// ==========================
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const options: MongoClientOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 45000,
    };

    const client = new MongoClient(MONGODB_URI, options);
    await client.connect();

    const db = client.db(MONGODB_DB);

    await db.admin().ping();
    console.log('✅ Successfully connected to MongoDB');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// ==========================
// CLOSE DB
// ==========================
export async function closeDatabase(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

// ==========================
// GET DB INSTANCE
// ==========================
export function getDatabase(): Db {
  if (!cachedDb) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return cachedDb;
}

// ==========================
// GET COUNTER COLLECTION (TYPED)
// ==========================
function getCountersCollection(db: Db): Collection<Counter> {
  return db.collection<Counter>('counters');
}

// ==========================
// AUTO-INCREMENT SEQUENCE
// ==========================
export async function getNextSequence(db: Db, sequenceName: string): Promise<number> {
  const counters = getCountersCollection(db);

  const result = await counters.findOneAndUpdate(
    { _id: sequenceName },          // ✅ now valid (string)
    { $inc: { seq: 1 } },
    {
      upsert: true,
      returnDocument: 'after',
    }
  );

  // ✅ MongoDB v5+ returns document directly
  if (result && typeof result.seq === 'number') {
    return result.seq;
  }

  // Fallback
  const counter = await counters.findOne({ _id: sequenceName });

  if (counter && typeof counter.seq === 'number') {
    return counter.seq;
  }

  // Initialize if missing
  await counters.updateOne(
    { _id: sequenceName },
    { $set: { seq: 1 } },
    { upsert: true }
  );

  return 1;
}

// ==========================
// SIMPLE VERSION (OPTIONAL)
// ==========================
export async function getNextSequenceSimple(db: Db, sequenceName: string): Promise<number> {
  const counters = getCountersCollection(db);

  const counter = await counters.findOne({ _id: sequenceName });

  const nextSeq = counter?.seq ? counter.seq + 1 : 1;

  await counters.updateOne(
    { _id: sequenceName },
    { $set: { seq: nextSeq } },
    { upsert: true }
  );

  return nextSeq;
}

// ==========================
// ID GENERATOR
// ==========================
export function generateId(prefix: string, sequence: number): string {
  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

// ==========================
// OBJECT ID HELPERS
// ==========================
export function toObjectId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

export function toObjectIdSafe(id: string | ObjectId | null | undefined): ObjectId | null {
  if (!id) return null;
  if (id instanceof ObjectId) return id;
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// ==========================
// EXPORT
// ==========================
export { ObjectId };