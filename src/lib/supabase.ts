import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          admission_no: string
          name: string
          mobile: string
          class: string
          division: string
          bus_stop: string
          bus_number: string
          trip_number: string
          created_at: string
        }
        Insert: {
          id?: string
          admission_no: string
          name: string
          mobile: string
          class: string
          division: string
          bus_stop: string
          bus_number: string
          trip_number: string
          created_at?: string
        }
        Update: {
          id?: string
          admission_no?: string
          name?: string
          mobile?: string
          class?: string
          division?: string
          bus_stop?: string
          bus_number?: string
          trip_number?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          student_id: string
          student_name: string
          admission_no: string
          development_fee: number
          bus_fee: number
          special_fee: number
          special_fee_type: string
          total_amount: number
          payment_date: string
          added_by: string
          class: string
          division: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          student_name: string
          admission_no: string
          development_fee: number
          bus_fee: number
          special_fee: number
          special_fee_type: string
          total_amount: number
          payment_date: string
          added_by: string
          class: string
          division: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          student_name?: string
          admission_no?: string
          development_fee?: number
          bus_fee?: number
          special_fee?: number
          special_fee_type?: string
          total_amount?: number
          payment_date?: string
          added_by?: string
          class?: string
          division?: string
          created_at?: string
        }
      }
      fee_config: {
        Row: {
          id: string
          config_type: string
          config_key: string
          config_value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          config_type: string
          config_key: string
          config_value: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          config_type?: string
          config_key?: string
          config_value?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}