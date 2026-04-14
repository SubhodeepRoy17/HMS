import { ObjectId } from 'mongodb';

export interface ServiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
  category: 'consultation' | 'pathology' | 'imaging' | 'procedure' | 'medicine' | 'other';
}

export interface Concession {
  percentage?: number;
  amount?: number;
  authority: string;
  reason?: string;
  approvedBy?: string;
}

export interface Bill {
  _id?: ObjectId;
  billNumber: string;
  billType: 'consultation' | 'lab';
  appointmentId?: ObjectId;
  patientId: ObjectId;
  patientName: string;
  registrationId?: ObjectId; // Link to OPD/IPD registration
  patientType: 'General' | 'VIP' | 'Insurance' | 'Panel';
  paymentType: 'Cash' | 'Credit' | 'Insurance' | 'Online';
  timeSlot: 'Morning' | 'Evening' | 'Night';
  doctorType: 'General' | 'Emergency';
  
  services: ServiceItem[];
  subTotal: number;
  tax: number;
  concession: Concession;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paymentDate?: Date;
  receiptNumber?: string;
  
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentReceipt {
  _id?: ObjectId;
  receiptNumber: string;
  billId: ObjectId;
  patientId: ObjectId;
  patientName: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  printedDate: Date;
  printedBy: ObjectId;
}