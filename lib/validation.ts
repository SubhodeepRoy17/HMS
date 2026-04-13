/**
 * Validation utilities for hospital management forms
 */

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Phone number validation
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Age validation
export const validateAge = (age: number): boolean => {
  return age >= 0 && age <= 150
}

// Patient registration validation
export const validatePatientRegistration = (data: {
  name?: string
  phone?: string
  email?: string
  age?: number
}): ValidationResult => {
  const errors: ValidationError[] = []

  if (!data.name || data.name.trim() === '') {
    errors.push({ field: 'name', message: 'Name is required' })
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Phone number must be 10 digits' })
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }

  if (data.age && !validateAge(data.age)) {
    errors.push({ field: 'age', message: 'Age must be between 0 and 150' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Appointment validation
export const validateAppointment = (data: {
  patientId?: string
  doctorName?: string
  appointmentTime?: string
}): ValidationResult => {
  const errors: ValidationError[] = []

  if (!data.patientId || data.patientId.trim() === '') {
    errors.push({ field: 'patientId', message: 'Patient ID is required' })
  }

  if (!data.doctorName || data.doctorName.trim() === '') {
    errors.push({ field: 'doctorName', message: 'Doctor name is required' })
  }

  if (!data.appointmentTime || data.appointmentTime.trim() === '') {
    errors.push({ field: 'appointmentTime', message: 'Appointment time is required' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Invoice validation
export const validateInvoice = (data: {
  patientId?: string
  amount?: number
}): ValidationResult => {
  const errors: ValidationError[] = []

  if (!data.patientId || data.patientId.trim() === '') {
    errors.push({ field: 'patientId', message: 'Patient ID is required' })
  }

  if (!data.amount || data.amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than 0' })
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Blood group validation
export const validateBloodGroup = (bloodGroup: string): boolean => {
  const validGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
  return validGroups.includes(bloodGroup)
}
