import { Db } from 'mongodb';
import { ObjectId } from 'mongodb';

export * from './User';

export interface BaseModel {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export function getCollection(db: Db, name: string) {
  return db.collection(name);
}

export { ObjectId };