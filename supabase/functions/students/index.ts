import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Student {
  id?: string
  admission_no: string
  name: string
  mobile: string
  class: string
  division: string
  bus_stop: string
  bus_number: string
  trip_number: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const segments = url.pathname.split('/').filter(Boolean)
    const studentId = segments[segments.length - 1]

    switch (req.method) {
      case 'GET':
        if (studentId && studentId !== 'students') {
          // Get single student
          const { data, error } = await supabaseClient
            .from('students')
            .select('*')
            .eq('id', studentId)
            .single()

          if (error) throw error

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } else {
          // Get all students with optional filters
          const classFilter = url.searchParams.get('class')
          const divisionFilter = url.searchParams.get('division')
          const searchTerm = url.searchParams.get('search')

          let query = supabaseClient.from('students').select('*')

          if (classFilter) {
            query = query.eq('class', classFilter)
          }
          if (divisionFilter) {
            query = query.eq('division', divisionFilter)
          }
          if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,admission_no.ilike.%${searchTerm}%`)
          }

          const { data, error } = await query.order('created_at', { ascending: false })

          if (error) throw error

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'POST':
        const newStudent: Student = await req.json()
        
        const { data, error } = await supabaseClient
          .from('students')
          .insert({
            admission_no: newStudent.admission_no,
            name: newStudent.name,
            mobile: newStudent.mobile,
            class: newStudent.class,
            division: newStudent.division,
            bus_stop: newStudent.bus_stop,
            bus_number: newStudent.bus_number,
            trip_number: newStudent.trip_number,
          })
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })

      case 'PUT':
        const updatedStudent: Partial<Student> = await req.json()
        
        const updateData: any = {}
        if (updatedStudent.admission_no) updateData.admission_no = updatedStudent.admission_no
        if (updatedStudent.name) updateData.name = updatedStudent.name
        if (updatedStudent.mobile) updateData.mobile = updatedStudent.mobile
        if (updatedStudent.class) updateData.class = updatedStudent.class
        if (updatedStudent.division) updateData.division = updatedStudent.division
        if (updatedStudent.bus_stop) updateData.bus_stop = updatedStudent.bus_stop
        if (updatedStudent.bus_number) updateData.bus_number = updatedStudent.bus_number
        if (updatedStudent.trip_number) updateData.trip_number = updatedStudent.trip_number

        const { data: updateResult, error: updateError } = await supabaseClient
          .from('students')
          .update(updateData)
          .eq('id', studentId)
          .select()
          .single()

        if (updateError) throw updateError

        return new Response(JSON.stringify(updateResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'DELETE':
        const { error: deleteError } = await supabaseClient
          .from('students')
          .delete()
          .eq('id', studentId)

        if (deleteError) throw deleteError

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        return new Response('Method not allowed', {
          headers: corsHeaders,
          status: 405,
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})