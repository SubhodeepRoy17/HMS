/**
 * API Client utility for making authenticated requests to the backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  code?: string;
  data?: T;
  token?: string;
  user?: T;
}

/**
 * Get JWT token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Set JWT token in localStorage AND as a cookie for middleware
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
  document.cookie = `auth_token=${token}; path=/; max-age=604800`;
}

/**
 * Remove JWT token from localStorage AND cookie
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  document.cookie = 'auth_token=; path=/; max-age=0';
}

/**
 * Get request headers with Authorization token
 */
function getHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Generic API request function
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { includeAuth?: boolean } = {}
): Promise<ApiResponse<T>> {
  const { includeAuth = true, ...fetchOptions } = options;

  try {
    const url = `${API_URL}${endpoint}`;
    const headers = getHeaders(includeAuth);

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...fetchOptions.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      success: false,
      message,
      code: 'REQUEST_ERROR',
    };
  }
}

/**
 * Auth API Methods
 */
export const authApi = {
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    role: string;
    department?: string;
    specialization?: string;
  }) {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: false,
    });

    if (response.success && response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  async login(data: { email: string; password: string }) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: false,
    });

    if (response.success && response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  async verifyToken() {
    return apiRequest('/auth/verify', {
      method: 'GET',
      includeAuth: true,
    });
  },

  async getCurrentUser() {
    return apiRequest('/auth/me', {
      method: 'GET',
      includeAuth: true,
    });
  },

  async logout() {
    const response = await apiRequest('/auth/logout', {
      method: 'POST',
      includeAuth: true,
    });

    removeAuthToken();
    return response;
  },
};

/**
 * Admin API Methods
 */
export const adminApi = {
  async getDashboardStats() {
    return apiRequest('/admin/dashboard/stats', {
      method: 'GET',
      includeAuth: true,
    });
  },

  async getUsers(role?: string, page = 1) {
    const query = new URLSearchParams();
    if (role && role !== 'all') {
      query.append('role', role);
    }
    query.append('page', page.toString());

    return apiRequest(`/admin/users?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async createStaffUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    role: 'doctor' | 'receptionist';
    department?: string;
    specialization?: string;
  }) {
    return apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  async getActivityFeed() {
    return apiRequest('/admin/activity', {
      method: 'GET',
      includeAuth: true,
    });
  },

  async getSettings() {
    return apiRequest('/admin/settings', {
      method: 'GET',
      includeAuth: true,
    });
  },

  async updateSettings(data: Record<string, unknown>) {
    return apiRequest('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },
};

/**
 * Reception API Methods
 */
export const receptionApi = {
  // Patient Management
  async getPatients(search?: string, patientId?: string, page = 1, limit = 10) {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    if (patientId) query.append('patientId', patientId);
    query.append('page', page.toString());
    query.append('limit', limit.toString());

    return apiRequest(`/reception/patients?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async registerOPDPatient(data: {
    firstName: string;
    lastName: string;
    age: number;
    sex: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone: string;
    email?: string;
    nationality?: string;
    department: string;
    consultantId: string;
    consultantName: string;
    referringSource?: string;
    sponsorship?: string;
    collectConsultationCharge?: boolean;
    consultationCharge?: number;
    paymentMethod?: string;
  }) {
    return apiRequest('/registration/opd', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  async registerIPDPatient(data: {
    firstName: string;
    lastName: string;
    age: number;
    sex: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone: string;
    email?: string;
    nationality?: string;
    department: string;
    consultantId: string;
    consultantName: string;
    referringSource?: string;
    sponsorship?: string;
    roomNumber: string;
    bedNumber?: string;
    admittingDoctorId?: string;
    expectedDischargeDate?: string;
    treatmentRequired?: string;
  }) {
    return apiRequest('/registration/ipd', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  // Appointments
  async getAppointments(patientId?: string, doctorId?: string, date?: string, status?: string, page = 1, limit = 10) {
    const query = new URLSearchParams();
    if (patientId) query.append('patientId', patientId);
    if (doctorId) query.append('doctorId', doctorId);
    if (date) query.append('date', date);
    if (status && status !== 'all') query.append('status', status);
    query.append('page', page.toString());
    query.append('limit', limit.toString());

    return apiRequest(`/reception/appointments?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async createAppointment(data: {
    patientId: string;
    patientName: string;
    patientPhone: string;
    doctorId: string;
    doctorName: string;
    department: string;
    appointmentDate: string;
    timeSlot: string;
    reason: string;
    notes?: string;
  }) {
    return apiRequest('/reception/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  async updateAppointment(appointmentId: string, data: { status?: string; notes?: string }) {
    return apiRequest(`/reception/appointments`, {
      method: 'PUT',
      body: JSON.stringify({ appointmentId, ...data }),
      includeAuth: true,
    });
  },

  async cancelAppointment(appointmentId: string) {
    return apiRequest(`/reception/appointments/${appointmentId}`, {
      method: 'DELETE',
      includeAuth: true,
    });
  },

  async rescheduleAppointment(appointmentId: string, newDate: string, newTimeSlot: string) {
    return apiRequest(`/reception/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ newDate, newTimeSlot }),
      includeAuth: true,
    });
  },

  // Doctor Schedule
  async getDoctorSchedules(doctorId?: string, department?: string, date?: string) {
    const query = new URLSearchParams();
    if (doctorId) query.append('doctorId', doctorId);
    if (department) query.append('department', department);
    if (date) query.append('date', date);

    return apiRequest(`/reception/doctors/schedule?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async createDoctorSchedule(data: {
    doctorId: string;
    doctorName: string;
    department: string;
    doctorType?: string;
    date: string;
    timeSlots: { startTime: string; endTime: string }[];
  }) {
    return apiRequest('/reception/doctors/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  // Enquiries
  async searchPatient(query: string) {
    return apiRequest(`/reception/enquiry/patient?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async getConsultantInfo(doctorId?: string, department?: string, specialization?: string, date?: string) {
    const query = new URLSearchParams();
    if (doctorId) query.append('doctorId', doctorId);
    if (department) query.append('department', department);
    if (specialization) query.append('specialization', specialization);
    if (date) query.append('date', date);

    return apiRequest(`/reception/enquiry/consultant?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  // Inpatient Daily Report
  async getInpatientDailyReport(date?: string, registrationId?: string) {
    const query = new URLSearchParams();
    if (date) query.append('date', date);
    if (registrationId) query.append('registrationId', registrationId);

    return apiRequest(`/registration/inpatient-daily?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async getRoomStatus() {
    return apiRequest('/reception/rooms/status', {
      method: 'GET',
      includeAuth: true,
    });
  },

  async getTariffs() {
    return apiRequest('/reception/tariffs', {
      method: 'GET',
      includeAuth: true,
    });
  },
};

/**
 * Billing API Methods
 */
export const billingApi = {
  async getBills(patientId?: string, status?: string, startDate?: string, endDate?: string, page = 1, limit = 10, billType?: 'consultation' | 'lab') {
    const query = new URLSearchParams();
    if (patientId) query.append('patientId', patientId);
    if (status && status !== 'all') query.append('status', status);
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (billType) query.append('billType', billType);
    query.append('page', page.toString());
    query.append('limit', limit.toString());

    return apiRequest(`/billing/opd?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async createBill(data: {
    patientId: string;
    patientName: string;
    registrationId?: string;
    patientType: 'General' | 'VIP' | 'Insurance' | 'Panel';
    paymentType: 'Cash' | 'Credit' | 'Insurance' | 'Online';
    timeSlot: 'Morning' | 'Evening' | 'Night';
    doctorType: 'General' | 'Emergency';
    billType?: 'consultation' | 'lab';
    services: { description: string; category: string; quantity: number }[];
    concessionPercentage?: number;
    concessionAmount?: number;
    concessionAuthority?: string;
  }) {
    return apiRequest('/billing/opd', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  async getReceipt(receiptId: string) {
    return apiRequest(`/billing/receipt/${receiptId}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async getReceipts() {
    return apiRequest('/billing/receipt', {
      method: 'GET',
      includeAuth: true,
    });
  },

  async processPayment(billId: string, amount: number, paymentMethod: string, transactionId?: string) {
    return apiRequest(`/billing/receipt/${billId}`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod, transactionId }),
      includeAuth: true,
    });
  },

  async getCharges(category?: string, patientType?: string) {
    const query = new URLSearchParams();
    if (category) query.append('category', category);
    if (patientType) query.append('patientType', patientType);

    return apiRequest(`/billing/charges?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },
};

/**
 * Investigations API Methods
 */
export const investigationsApi = {
  async getInvestigations(patientId?: string, status?: string, testCategory?: string, page = 1, limit = 10) {
    const query = new URLSearchParams();
    if (patientId) query.append('patientId', patientId);
    if (status && status !== 'all') query.append('status', status);
    if (testCategory && testCategory !== 'all') query.append('testCategory', testCategory);
    query.append('page', page.toString());
    query.append('limit', limit.toString());

    return apiRequest(`/investigations/lab?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async orderInvestigation(data: {
    patientId: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    registrationId?: string;
    testName: string;
    testCategory: string;
    department: string;
    clinicalNotes?: string;
  }) {
    return apiRequest('/investigations/lab', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  async enterResults(investigationId: string, parameters: Record<string, string>, enteredBy: string) {
    return apiRequest(`/investigations/lab/${investigationId}`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'enter_results', parameters, enteredBy }),
      includeAuth: true,
    });
  },

  async verifyResults(investigationId: string, verificationPassword: string, reportNotes?: string) {
    return apiRequest(`/investigations/lab/${investigationId}`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'verify', verificationPassword, reportNotes }),
      includeAuth: true,
    });
  },

  async getReport(investigationId: string) {
    return apiRequest(`/investigations/reports/${investigationId}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async importEquipmentResults(investigationId: string, parameters: Record<string, string>, source: string) {
    return apiRequest(`/investigations/lab/${investigationId}`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'import_equipment_results', parameters, source }),
      includeAuth: true,
    });
  },
};

/**
 * Doctor API Methods
 */
export const doctorApi = {
  async getAppointments(status?: string, page = 1) {
    const query = new URLSearchParams();
    if (status && status !== 'all') {
      query.append('status', status);
    }
    query.append('page', page.toString());

    return apiRequest(`/doctor/appointments?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async getAppointment(appointmentId: string) {
    return apiRequest(`/doctor/appointments/${appointmentId}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async createAppointment(data: {
    patientId: string;
    appointmentDate: string;
    reason: string;
    notes?: string;
  }) {
    return apiRequest('/doctor/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  async updateAppointment(appointmentId: string, data: {
    status?: string;
    notes?: string;
    appointmentDate?: string;
    reason?: string;
    doctorSummary?: string;
    consultationFee?: number;
    prescribedMedicines?: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration?: string;
      quantity?: string | number;
      rate?: string | number;
      instructions?: string;
    }>;
    opdConsultation?: {
      complaints?: string;
      history?: string;
      diagnosis?: string;
      investigation?: string;
      medicines?: string;
      advice?: string;
      nextVisit?: string;
    };
  }) {
    return apiRequest(`/doctor/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  async deleteAppointment(appointmentId: string) {
    return apiRequest(`/doctor/appointments/${appointmentId}`, {
      method: 'DELETE',
      includeAuth: true,
    });
  },

  async getMedicalRecords(patientId?: string, recordType?: string, search?: string, page = 1) {
    const query = new URLSearchParams();
    if (patientId) {
      query.append('patientId', patientId);
    }
    if (recordType && recordType !== 'all') {
      query.append('recordType', recordType);
    }
    if (search) {
      query.append('search', search);
    }
    query.append('page', page.toString());

    return apiRequest(`/doctor/medical-records?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async createMedicalRecord(data: {
    patientId: string;
    patientName: string;
    recordType: string;
    description: string;
    findings?: string;
    status?: string;
  }) {
    return apiRequest('/doctor/medical-records', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  async getPrescriptions(patientId?: string, status?: string, page = 1) {
    const query = new URLSearchParams();
    if (patientId) {
      query.append('patientId', patientId);
    }
    if (status && status !== 'all') {
      query.append('status', status);
    }
    query.append('page', page.toString());

    return apiRequest(`/doctor/prescriptions?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async createPrescription(data: {
    patientId: string;
    medication: string;
    dosage: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    notes?: string;
  }) {
    return apiRequest('/doctor/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  async updatePrescriptionStatus(prescriptionId: string, data: { status: string }) {
    return apiRequest(`/doctor/prescriptions/${prescriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      includeAuth: true,
    });
  },

  async getDashboardSummary() {
    return apiRequest('/doctor/dashboard/summary', {
      method: 'GET',
      includeAuth: true,
    });
  },

  async searchPatients(query: string, limit = 10) {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());

    return apiRequest(`/doctor/patients/search?${params.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },
};

/**
 * Patient API Methods
 */
export const patientApi = {
  async getMedicalHistory(patientId?: string) {
    const query = new URLSearchParams();
    if (patientId) query.append('patientId', patientId);
    
    return apiRequest(`/patient/medical-history?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  async getLabResults(patientId?: string, status?: string) {
    const query = new URLSearchParams();
    if (patientId) query.append('patientId', patientId);
    if (status) query.append('status', status);
    
    return apiRequest(`/patient/lab-results?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
  },

  // FIXED: Get my appointments - uses token, no patientId param needed
  async getMyAppointments(status?: string) {
    const query = new URLSearchParams();
    if (status && status !== 'all') query.append('status', status);
    
    const response = await apiRequest(`/patient/appointments?${query.toString()}`, {
      method: 'GET',
      includeAuth: true,
    });
    
    // Handle the response format correctly
    if (response.success && response.data) {
      return response;
    }
    return { success: false, data: [], message: 'No appointments found' };
  },

  // FIXED: Book appointment
  async bookAppointment(data: {
    doctorId: string;
    appointmentDate: string;
    timeSlot: string;
    reason: string;
    notes?: string;
  }) {
    const response = await apiRequest('/patient/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
      includeAuth: true,
    });
    
    return response;
  },

  // FIXED: Cancel appointment
  async cancelAppointment(appointmentId: string) {
    const response = await apiRequest(`/patient/appointments?id=${appointmentId}`, {
      method: 'DELETE',
      includeAuth: true,
    });
    
    return response;
  },

  async getDashboardStats() {
    return apiRequest('/patient/dashboard/stats', {
      method: 'GET',
      includeAuth: true,
    });
  },
};

export default apiRequest;