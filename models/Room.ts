import { ObjectId } from 'mongodb';

export interface Room {
  _id?: ObjectId;
  roomNumber: string;
  floor: number;
  roomType: 'General' | 'Semi-Private' | 'Private' | 'ICU' | 'Deluxe';
  bedCount: number;
  availableBeds: number;
  dailyRate: number;
  amenities: string[];
  isActive: boolean;
}

export interface BedAllocation {
  _id?: ObjectId;
  patientId: ObjectId;
  patientName: string;
  registrationId: ObjectId;
  roomId: ObjectId;
  roomNumber: string;
  bedNumber: string;
  allocatedDate: Date;
  expectedDischargeDate?: Date;
  actualDischargeDate?: Date;
  status: 'occupied' | 'vacated';
}