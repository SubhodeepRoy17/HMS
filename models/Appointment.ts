import { ObjectId } from 'mongodb';

export interface Appointment {
  _id?: ObjectId;
  appointmentId: string;
  patientId: string;  // Changed from ObjectId to string (matches PAT001 format)
  patientRegistrationId?: ObjectId; // Link to specific registration
  patientName: string;
  patientPhone: string;
  doctorId: ObjectId;
  doctorName: string;
  department: string;
  appointmentDate: Date;
  timeSlot: string;
  reason: string;
  notes?: string;
  status: 'scheduled' | 'arrived' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorSchedule {
  _id?: ObjectId;
  doctorId: ObjectId;
  doctorName: string;
  department: string;
  date: Date;
  timeSlots: {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    patientId?: string;  // Changed to string
    appointmentId?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}