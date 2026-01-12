export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          name: string
          address: string | null
          total_units: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          total_units?: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          address?: string | null
          total_units?: number
          created_by?: string | null
          created_at?: string
        }
      }
      units: {
        Row: {
          id: string
          property_id: string
          unit_number: string
          floor_number: string | null
          // We force the status to be specific strings so the Badge component is happy
          status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' 
          type: string
          rent_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          unit_number: string
          floor_number?: string | null
          status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'
          type?: string
          rent_amount: number
          created_at?: string
        }
        Update: {
          unit_number?: string
          floor_number?: string | null
          status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'
          rent_amount?: number
        }
      }
    }
  }
}