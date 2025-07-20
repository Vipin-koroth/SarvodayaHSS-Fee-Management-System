// API client for Supabase Edge Functions
const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

// Get auth headers for API requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('supabase.auth.token')
  return {
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
}

// Students API
export const studentsApi = {
  // Get all students with optional filters
  getAll: async (filters?: { class?: string; division?: string; search?: string }) => {
    const params = new URLSearchParams()
    if (filters?.class) params.append('class', filters.class)
    if (filters?.division) params.append('division', filters.division)
    if (filters?.search) params.append('search', filters.search)
    
    const response = await fetch(`${API_BASE_URL}/students?${params}`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to fetch students')
    return response.json()
  },

  // Get single student
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to fetch student')
    return response.json()
  },

  // Create new student
  create: async (student: any) => {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(student),
    })
    
    if (!response.ok) throw new Error('Failed to create student')
    return response.json()
  },

  // Update student
  update: async (id: string, student: any) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(student),
    })
    
    if (!response.ok) throw new Error('Failed to update student')
    return response.json()
  },

  // Delete student
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to delete student')
    return response.json()
  },
}

// Payments API
export const paymentsApi = {
  // Get all payments with optional filters
  getAll: async (filters?: { class?: string; division?: string; date?: string; student_id?: string }) => {
    const params = new URLSearchParams()
    if (filters?.class) params.append('class', filters.class)
    if (filters?.division) params.append('division', filters.division)
    if (filters?.date) params.append('date', filters.date)
    if (filters?.student_id) params.append('student_id', filters.student_id)
    
    const response = await fetch(`${API_BASE_URL}/payments?${params}`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to fetch payments')
    return response.json()
  },

  // Get single payment
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to fetch payment')
    return response.json()
  },

  // Create new payment
  create: async (payment: any) => {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payment),
    })
    
    if (!response.ok) throw new Error('Failed to create payment')
    return response.json()
  },

  // Update payment
  update: async (id: string, payment: any) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payment),
    })
    
    if (!response.ok) throw new Error('Failed to update payment')
    return response.json()
  },

  // Delete payment
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to delete payment')
    return response.json()
  },
}

// Fee Configuration API
export const feeConfigApi = {
  // Get fee configuration
  get: async (type?: string) => {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    
    const response = await fetch(`${API_BASE_URL}/fee-config?${params}`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to fetch fee configuration')
    return response.json()
  },

  // Update fee configuration
  update: async (config: any) => {
    const response = await fetch(`${API_BASE_URL}/fee-config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    })
    
    if (!response.ok) throw new Error('Failed to update fee configuration')
    return response.json()
  },

  // Delete specific fee configuration
  delete: async (type: string, key: string) => {
    const params = new URLSearchParams({ type, key })
    
    const response = await fetch(`${API_BASE_URL}/fee-config?${params}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to delete fee configuration')
    return response.json()
  },
}

// Reports API
export const reportsApi = {
  // Get class-wise report
  getClassWise: async () => {
    const response = await fetch(`${API_BASE_URL}/reports?type=class-wise`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to fetch class-wise report')
    return response.json()
  },

  // Get bus stop report
  getBusStop: async () => {
    const response = await fetch(`${API_BASE_URL}/reports?type=bus-stop`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to fetch bus stop report')
    return response.json()
  },

  // Get monthly report
  getMonthly: async (month: string) => {
    const response = await fetch(`${API_BASE_URL}/reports?type=monthly&month=${month}`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to fetch monthly report')
    return response.json()
  },

  // Get summary report
  getSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/reports?type=summary`, {
      headers: getAuthHeaders(),
    })
    
    if (!response.ok) throw new Error('Failed to fetch summary report')
    return response.json()
  },
}

// Notifications API
export const notificationsApi = {
  // Send SMS
  sendSMS: async (data: { provider: string; credentials: any; mobile: string; message: string }) => {
    const response = await fetch(`${API_BASE_URL}/notifications/sms`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    
    if (!response.ok) throw new Error('Failed to send SMS')
    return response.json()
  },

  // Send WhatsApp
  sendWhatsApp: async (data: { provider: string; credentials: any; mobile: string; message: string }) => {
    const response = await fetch(`${API_BASE_URL}/notifications/whatsapp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    })
    
    if (!response.ok) throw new Error('Failed to send WhatsApp')
    return response.json()
  },
}