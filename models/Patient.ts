import { ObjectId } from 'mongodb';

export interface PatientDemographics {
  firstName: string;
  lastName: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  dateOfBirth: Date;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  nationality: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface PatientRegistration {
  _id?: ObjectId;
  userId?: ObjectId; // Reference to users collection if registered user
  patientId: string; // Unique patient ID (e.g., PAT001)
  registrationNumber: string; // New for each visit (e.g., REG2024001)
  patientType: 'OPD' | 'IPD';
  demographics: PatientDemographics;
  
  // Visit information
  department: string;
  consultantId: ObjectId;
  consultantName: string;
  referringSource?: string;
  sponsorship?: string;
  panelDetails?: string;
  
  // For IPD only
  roomNumber?: string;
  bedNumber?: string;
  admissionDate?: Date;
  expectedDischargeDate?: Date;
  admittingDoctorId?: ObjectId;
  
  // Billing
  consultationCharges?: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  receiptNumber?: string;
  
  // Status
  status: 'active' | 'discharged' | 'cancelled';
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OPDCard {
  _id?: ObjectId;
  registrationId: ObjectId;
  patientId: string;
  patientName: string;
  cardNumber: string;
  issuedDate: Date;
  isValid: boolean;
}