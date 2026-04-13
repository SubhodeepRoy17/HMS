import { ObjectId } from 'mongodb';

export interface TestParameter {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
  interpretation?: string;
  previousValue?: string;
}

export interface Investigation {
  _id?: ObjectId;
  investigationId: string;
  patientId: ObjectId;
  patientName: string;
  patientAge: number;
  patientGender: string;
  registrationId?: ObjectId;
  
  testName: string;
  testCategory: 'Pathology' | 'Imaging' | 'Cardiology' | 'Other';
  department: string;
  
  requisitionDate: Date;
  requisitionedBy: ObjectId; // Doctor ID
  clinicalNotes?: string;
  
  // Results
  parameters: TestParameter[];
  status: 'pending' | 'in-progress' | 'entered' | 'verified' | 'completed' | 'cancelled';
  enteredBy?: string;
  enteredDate?: Date;
  verifiedBy?: string;
  verifiedDate?: Date;
  
  // For imaging
  imageUrls?: string[];
  radiologistNotes?: string;
  
  reportGeneratedDate?: Date;
  reportUrl?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface TestMaster {
  _id?: ObjectId;
  testCode: string;
  testName: string;
  category: string;
  department: string;
  parameters: {
    name: string;
    unit: string;
    referenceRange: string;
    isNumeric: boolean;
    options?: string[];
    formula?: string;
  }[];
  price: number;
  turnAroundTime: string; // e.g., "24 hours"
  isActive: boolean;
}