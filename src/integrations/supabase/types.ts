export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          auto_resolved: boolean | null
          created_at: string | null
          equipment_id: string | null
          id: string
          message: string
          resolved_at: string | null
          severity: string
          source_id: string | null
          source_table: string | null
          title: string
          work_order_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          auto_resolved?: boolean | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          message: string
          resolved_at?: string | null
          severity: string
          source_id?: string | null
          source_table?: string | null
          title: string
          work_order_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          auto_resolved?: boolean | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          message?: string
          resolved_at?: string | null
          severity?: string
          source_id?: string | null
          source_table?: string | null
          title?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      calibrations: {
        Row: {
          calibration_interval_days: number | null
          calibration_type: string
          certificate_number: string | null
          created_at: string | null
          equipment_id: string | null
          id: string
          last_calibration_date: string | null
          measurements: Json | null
          next_calibration_due: string
          notes: string | null
          passed: boolean | null
          performed_by: string | null
          standards_used: string | null
          status: Database["public"]["Enums"]["calibration_status"] | null
        }
        Insert: {
          calibration_interval_days?: number | null
          calibration_type: string
          certificate_number?: string | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          last_calibration_date?: string | null
          measurements?: Json | null
          next_calibration_due: string
          notes?: string | null
          passed?: boolean | null
          performed_by?: string | null
          standards_used?: string | null
          status?: Database["public"]["Enums"]["calibration_status"] | null
        }
        Update: {
          calibration_interval_days?: number | null
          calibration_type?: string
          certificate_number?: string | null
          created_at?: string | null
          equipment_id?: string | null
          id?: string
          last_calibration_date?: string | null
          measurements?: Json | null
          next_calibration_due?: string
          notes?: string | null
          passed?: boolean | null
          performed_by?: string | null
          standards_used?: string | null
          status?: Database["public"]["Enums"]["calibration_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "calibrations_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calibrations_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          entities_referenced: Json | null
          id: string
          role: string
          session_id: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          entities_referenced?: Json | null
          id?: string
          role: string
          session_id: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          entities_referenced?: Json | null
          id?: string
          role?: string
          session_id?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: []
      }
      cost_tracking: {
        Row: {
          amount: number
          billed: boolean | null
          billing_period: string | null
          cost_date: string | null
          cost_type: string
          created_at: string | null
          description: string | null
          equipment_id: string | null
          farm_id: string | null
          id: string
          invoice_number: string | null
          is_billable: boolean | null
          notes: string | null
          purchase_order_id: string | null
          vendor_id: string | null
          work_order_id: string | null
        }
        Insert: {
          amount: number
          billed?: boolean | null
          billing_period?: string | null
          cost_date?: string | null
          cost_type: string
          created_at?: string | null
          description?: string | null
          equipment_id?: string | null
          farm_id?: string | null
          id?: string
          invoice_number?: string | null
          is_billable?: boolean | null
          notes?: string | null
          purchase_order_id?: string | null
          vendor_id?: string | null
          work_order_id?: string | null
        }
        Update: {
          amount?: number
          billed?: boolean | null
          billing_period?: string | null
          cost_date?: string | null
          cost_type?: string
          created_at?: string | null
          description?: string | null
          equipment_id?: string | null
          farm_id?: string | null
          id?: string
          invoice_number?: string | null
          is_billable?: boolean | null
          notes?: string | null
          purchase_order_id?: string | null
          vendor_id?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_tracking_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_tracking_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_tracking_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_tracking_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_tracking_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_logs: {
        Row: {
          arrival_time: string | null
          created_at: string | null
          departure_time: string | null
          dispatch_time: string | null
          gps_route: Json | null
          id: string
          notes: string | null
          status: string | null
          technician_id: string | null
          travel_distance_km: number | null
          work_order_id: string | null
        }
        Insert: {
          arrival_time?: string | null
          created_at?: string | null
          departure_time?: string | null
          dispatch_time?: string | null
          gps_route?: Json | null
          id?: string
          notes?: string | null
          status?: string | null
          technician_id?: string | null
          travel_distance_km?: number | null
          work_order_id?: string | null
        }
        Update: {
          arrival_time?: string | null
          created_at?: string | null
          departure_time?: string | null
          dispatch_time?: string | null
          gps_route?: Json | null
          id?: string
          notes?: string | null
          status?: string | null
          technician_id?: string | null
          travel_distance_km?: number | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_logs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          equipment_id: string | null
          expiry_date: string | null
          file_size: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          name: string
          tags: string[] | null
          uploaded_by: string | null
          vendor_id: string | null
          work_order_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          equipment_id?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name: string
          tags?: string[] | null
          uploaded_by?: string | null
          vendor_id?: string | null
          work_order_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          equipment_id?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          tags?: string[] | null
          uploaded_by?: string | null
          vendor_id?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_hours: {
        Row: {
          approved: boolean | null
          approved_by: string | null
          break_minutes: number | null
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          id: string
          notes: string | null
          overtime_hours: number | null
          regular_hours: number | null
          technician_id: string | null
          work_date: string
          work_order_id: string | null
        }
        Insert: {
          approved?: boolean | null
          approved_by?: string | null
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          regular_hours?: number | null
          technician_id?: string | null
          work_date: string
          work_order_id?: string | null
        }
        Update: {
          approved?: boolean | null
          approved_by?: string | null
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          regular_hours?: number | null
          technician_id?: string | null
          work_date?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_hours_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_hours_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string | null
          current_operating_hours: number | null
          equipment_code: string
          equipment_type: string
          farm_id: string | null
          id: string
          last_service_date: string | null
          location_gps: Json | null
          manufacturer: string | null
          metadata: Json | null
          model: string | null
          name: string
          next_service_due: string | null
          purchase_date: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"] | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          created_at?: string | null
          current_operating_hours?: number | null
          equipment_code: string
          equipment_type: string
          farm_id?: string | null
          id?: string
          last_service_date?: string | null
          location_gps?: Json | null
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          name: string
          next_service_due?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"] | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          created_at?: string | null
          current_operating_hours?: number | null
          equipment_code?: string
          equipment_type?: string
          farm_id?: string | null
          id?: string
          last_service_date?: string | null
          location_gps?: Json | null
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          name?: string
          next_service_due?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"] | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          amenities: string[] | null
          capacity: number | null
          created_at: string | null
          facility_type: Database["public"]["Enums"]["facility_type"]
          farm_id: string | null
          id: string
          is_available: boolean | null
          location_gps: Json | null
          metadata: Json | null
          name: string
        }
        Insert: {
          amenities?: string[] | null
          capacity?: number | null
          created_at?: string | null
          facility_type: Database["public"]["Enums"]["facility_type"]
          farm_id?: string | null
          id?: string
          is_available?: boolean | null
          location_gps?: Json | null
          metadata?: Json | null
          name: string
        }
        Update: {
          amenities?: string[] | null
          capacity?: number | null
          created_at?: string | null
          facility_type?: Database["public"]["Enums"]["facility_type"]
          farm_id?: string | null
          id?: string
          is_available?: boolean | null
          location_gps?: Json | null
          metadata?: Json | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "facilities_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_bookings: {
        Row: {
          booked_by: string | null
          created_at: string | null
          end_time: string
          equipment_id: string | null
          facility_id: string | null
          id: string
          notes: string | null
          purpose: string | null
          start_time: string
          status: string | null
          work_order_id: string | null
        }
        Insert: {
          booked_by?: string | null
          created_at?: string | null
          end_time: string
          equipment_id?: string | null
          facility_id?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          start_time: string
          status?: string | null
          work_order_id?: string | null
        }
        Update: {
          booked_by?: string | null
          created_at?: string | null
          end_time?: string
          equipment_id?: string | null
          facility_id?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          start_time?: string
          status?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_bookings_booked_by_fkey"
            columns: ["booked_by"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_bookings_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_bookings_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_bookings_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          gps_coordinates: Json | null
          id: string
          location: string | null
          metadata: Json | null
          name: string
          size_hectares: number | null
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          gps_coordinates?: Json | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name: string
          size_hectares?: number | null
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          gps_coordinates?: Json | null
          id?: string
          location?: string | null
          metadata?: Json | null
          name?: string
          size_hectares?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inspections: {
        Row: {
          checklist: Json | null
          completed_date: string | null
          created_at: string | null
          documents: Json | null
          equipment_id: string | null
          follow_up_required: boolean | null
          follow_up_work_order_id: string | null
          id: string
          inspection_type: string
          inspector_id: string | null
          issues_found: string[] | null
          notes: string | null
          overall_result: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["inspection_status"] | null
        }
        Insert: {
          checklist?: Json | null
          completed_date?: string | null
          created_at?: string | null
          documents?: Json | null
          equipment_id?: string | null
          follow_up_required?: boolean | null
          follow_up_work_order_id?: string | null
          id?: string
          inspection_type: string
          inspector_id?: string | null
          issues_found?: string[] | null
          notes?: string | null
          overall_result?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["inspection_status"] | null
        }
        Update: {
          checklist?: Json | null
          completed_date?: string | null
          created_at?: string | null
          documents?: Json | null
          equipment_id?: string | null
          follow_up_required?: boolean | null
          follow_up_work_order_id?: string | null
          id?: string
          inspection_type?: string
          inspector_id?: string | null
          issues_found?: string[] | null
          notes?: string | null
          overall_result?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["inspection_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_follow_up_work_order_id_fkey"
            columns: ["follow_up_work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          barcode: string | null
          category: string | null
          compatible_equipment: string[] | null
          created_at: string | null
          description: string | null
          farm_id: string | null
          id: string
          last_restock_date: string | null
          location_bin: string | null
          manufacturer_id: string | null
          metadata: Json | null
          name: string
          part_number: string
          quantity_available: number | null
          quantity_on_hand: number | null
          quantity_reserved: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          rfid_tag: string | null
          unit_cost: number | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          compatible_equipment?: string[] | null
          created_at?: string | null
          description?: string | null
          farm_id?: string | null
          id?: string
          last_restock_date?: string | null
          location_bin?: string | null
          manufacturer_id?: string | null
          metadata?: Json | null
          name: string
          part_number: string
          quantity_available?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          rfid_tag?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          compatible_equipment?: string[] | null
          created_at?: string | null
          description?: string | null
          farm_id?: string | null
          id?: string
          last_restock_date?: string | null
          location_bin?: string | null
          manufacturer_id?: string | null
          metadata?: Json | null
          name?: string
          part_number?: string
          quantity_available?: number | null
          quantity_on_hand?: number | null
          quantity_reserved?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          rfid_tag?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          action_taken: string
          created_at: string | null
          equipment_id: string | null
          findings: string | null
          id: string
          log_timestamp: string | null
          next_steps: string | null
          parts_used: Json | null
          photos: Json | null
          technician_id: string | null
          time_spent_minutes: number | null
          work_order_id: string | null
        }
        Insert: {
          action_taken: string
          created_at?: string | null
          equipment_id?: string | null
          findings?: string | null
          id?: string
          log_timestamp?: string | null
          next_steps?: string | null
          parts_used?: Json | null
          photos?: Json | null
          technician_id?: string | null
          time_spent_minutes?: number | null
          work_order_id?: string | null
        }
        Update: {
          action_taken?: string
          created_at?: string | null
          equipment_id?: string | null
          findings?: string | null
          id?: string
          log_timestamp?: string | null
          next_steps?: string | null
          parts_used?: Json | null
          photos?: Json | null
          technician_id?: string | null
          time_spent_minutes?: number | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          support_portal: string | null
          warranty_policy: string | null
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          support_portal?: string | null
          warranty_policy?: string | null
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          support_portal?: string | null
          warranty_policy?: string | null
          website?: string | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          auto_created_work_order_id: string | null
          confidence_score: number | null
          created_at: string | null
          equipment_id: string | null
          estimated_cost: number | null
          failure_types: Json | null
          health_score: number | null
          id: string
          maintenance_urgency: string | null
          prediction_result: Json
          sensor_data: Json
          time_to_failure_hours: number | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          auto_created_work_order_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          equipment_id?: string | null
          estimated_cost?: number | null
          failure_types?: Json | null
          health_score?: number | null
          id?: string
          maintenance_urgency?: string | null
          prediction_result: Json
          sensor_data: Json
          time_to_failure_hours?: number | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          auto_created_work_order_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          equipment_id?: string | null
          estimated_cost?: number | null
          failure_types?: Json | null
          health_score?: number | null
          id?: string
          maintenance_urgency?: string | null
          prediction_result?: Json
          sensor_data?: Json
          time_to_failure_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          line_items: Json
          notes: string | null
          po_number: string
          requested_delivery_date: string | null
          shipping: number | null
          status: Database["public"]["Enums"]["purchase_order_status"] | null
          subtotal: number | null
          tax: number | null
          total: number | null
          triggered_by_work_order_id: string | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          line_items: Json
          notes?: string | null
          po_number: string
          requested_delivery_date?: string | null
          shipping?: number | null
          status?: Database["public"]["Enums"]["purchase_order_status"] | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          triggered_by_work_order_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          po_number?: string
          requested_delivery_date?: string | null
          shipping?: number | null
          status?: Database["public"]["Enums"]["purchase_order_status"] | null
          subtotal?: number | null
          tax?: number | null
          total?: number | null
          triggered_by_work_order_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_triggered_by_work_order_id_fkey"
            columns: ["triggered_by_work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      service_history: {
        Row: {
          created_at: string | null
          description: string | null
          equipment_id: string | null
          id: string
          labor_hours: number | null
          notes: string | null
          operating_hours_at_service: number | null
          parts_replaced: Json | null
          service_date: string
          service_type: string
          technician_id: string | null
          total_cost: number | null
          work_order_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          equipment_id?: string | null
          id?: string
          labor_hours?: number | null
          notes?: string | null
          operating_hours_at_service?: number | null
          parts_replaced?: Json | null
          service_date: string
          service_type: string
          technician_id?: string | null
          total_cost?: number | null
          work_order_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          equipment_id?: string | null
          id?: string
          labor_hours?: number | null
          notes?: string | null
          operating_hours_at_service?: number | null
          parts_replaced?: Json | null
          service_date?: string
          service_type?: string
          technician_id?: string | null
          total_cost?: number | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_history_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_history_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          created_at: string | null
          error: string | null
          event_data: Json
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          source_id: string
          source_table: string
          triggered_actions: Json | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_data: Json
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          source_id: string
          source_table: string
          triggered_actions?: Json | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          source_id?: string
          source_table?: string
          triggered_actions?: Json | null
        }
        Relationships: []
      }
      technicians: {
        Row: {
          created_at: string | null
          current_location_gps: Json | null
          email: string | null
          employee_id: string
          first_name: string
          hourly_rate: number | null
          id: string
          last_name: string
          metadata: Json | null
          phone: string | null
          skills: string[] | null
          status: Database["public"]["Enums"]["technician_status"] | null
          updated_at: string | null
          work_schedule: Json | null
        }
        Insert: {
          created_at?: string | null
          current_location_gps?: Json | null
          email?: string | null
          employee_id: string
          first_name: string
          hourly_rate?: number | null
          id?: string
          last_name: string
          metadata?: Json | null
          phone?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["technician_status"] | null
          updated_at?: string | null
          work_schedule?: Json | null
        }
        Update: {
          created_at?: string | null
          current_location_gps?: Json | null
          email?: string | null
          employee_id?: string
          first_name?: string
          hourly_rate?: number | null
          id?: string
          last_name?: string
          metadata?: Json | null
          phone?: string | null
          skills?: string[] | null
          status?: Database["public"]["Enums"]["technician_status"] | null
          updated_at?: string | null
          work_schedule?: Json | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          categories: string[] | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_preferred: boolean | null
          lead_time_days: number | null
          metadata: Json | null
          name: string
          payment_terms: string | null
          phone: string | null
          rating: number | null
          updated_at: string | null
          vendor_code: string | null
        }
        Insert: {
          address?: string | null
          categories?: string[] | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_preferred?: boolean | null
          lead_time_days?: number | null
          metadata?: Json | null
          name: string
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
          vendor_code?: string | null
        }
        Update: {
          address?: string | null
          categories?: string[] | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_preferred?: boolean | null
          lead_time_days?: number | null
          metadata?: Json | null
          name?: string
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
          vendor_code?: string | null
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          actual_cost: number | null
          actual_end: string | null
          actual_start: string | null
          assigned_technician_id: string | null
          completed_by: string | null
          completion_notes: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          equipment_id: string | null
          estimated_cost: number | null
          facility_id: string | null
          id: string
          labor_hours: number | null
          notes: string | null
          parts_required: Json | null
          parts_used: Json | null
          prediction_id: string | null
          priority: Database["public"]["Enums"]["work_order_priority"] | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["work_order_status"] | null
          title: string
          updated_at: string | null
          work_order_number: string
          work_type: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_end?: string | null
          actual_start?: string | null
          assigned_technician_id?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equipment_id?: string | null
          estimated_cost?: number | null
          facility_id?: string | null
          id?: string
          labor_hours?: number | null
          notes?: string | null
          parts_required?: Json | null
          parts_used?: Json | null
          prediction_id?: string | null
          priority?: Database["public"]["Enums"]["work_order_priority"] | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["work_order_status"] | null
          title: string
          updated_at?: string | null
          work_order_number: string
          work_type?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_end?: string | null
          actual_start?: string | null
          assigned_technician_id?: string | null
          completed_by?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equipment_id?: string | null
          estimated_cost?: number | null
          facility_id?: string | null
          id?: string
          labor_hours?: number | null
          notes?: string | null
          parts_required?: Json | null
          parts_used?: Json | null
          prediction_id?: string | null
          priority?: Database["public"]["Enums"]["work_order_priority"] | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["work_order_status"] | null
          title?: string
          updated_at?: string | null
          work_order_number?: string
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      calibration_status: "current" | "due_soon" | "overdue" | "in_progress"
      document_type:
        | "manual"
        | "certificate"
        | "report"
        | "warranty"
        | "contract"
        | "invoice"
        | "other"
      equipment_status:
        | "operational"
        | "warning"
        | "critical"
        | "maintenance"
        | "decommissioned"
      facility_type: "shed" | "workshop" | "storage" | "field" | "office"
      inspection_status:
        | "scheduled"
        | "in_progress"
        | "passed"
        | "failed"
        | "requires_action"
      purchase_order_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "ordered"
        | "shipped"
        | "received"
        | "cancelled"
      technician_status:
        | "available"
        | "on_job"
        | "on_break"
        | "off_duty"
        | "on_leave"
      work_order_priority: "low" | "medium" | "high" | "critical"
      work_order_status:
        | "pending"
        | "scheduled"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      calibration_status: ["current", "due_soon", "overdue", "in_progress"],
      document_type: [
        "manual",
        "certificate",
        "report",
        "warranty",
        "contract",
        "invoice",
        "other",
      ],
      equipment_status: [
        "operational",
        "warning",
        "critical",
        "maintenance",
        "decommissioned",
      ],
      facility_type: ["shed", "workshop", "storage", "field", "office"],
      inspection_status: [
        "scheduled",
        "in_progress",
        "passed",
        "failed",
        "requires_action",
      ],
      purchase_order_status: [
        "draft",
        "pending_approval",
        "approved",
        "ordered",
        "shipped",
        "received",
        "cancelled",
      ],
      technician_status: [
        "available",
        "on_job",
        "on_break",
        "off_duty",
        "on_leave",
      ],
      work_order_priority: ["low", "medium", "high", "critical"],
      work_order_status: [
        "pending",
        "scheduled",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
