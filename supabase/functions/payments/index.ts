import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Payment {
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
    const paymentId = segments[segments.length - 1]

    switch (req.method) {
      case 'GET':
        if (paymentId && paymentId !== 'payments') {
          // Get single payment
          const { data, error } = await supabaseClient
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single()

          if (error) throw error

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } else {
          // Get all payments with optional filters
          const classFilter = url.searchParams.get('class')
          const divisionFilter = url.searchParams.get('division')
          const dateFilter = url.searchParams.get('date')
          const studentId = url.searchParams.get('student_id')

          let query = supabaseClient.from('payments').select('*')

          if (classFilter) {
            query = query.eq('class', classFilter)
          }
          if (divisionFilter) {
            query = query.eq('division', divisionFilter)
          }
          if (dateFilter) {
            query = query.gte('payment_date', `${dateFilter}T00:00:00`)
                         .lt('payment_date', `${dateFilter}T23:59:59`)
          }
          if (studentId) {
            query = query.eq('student_id', studentId)
          }

          const { data, error } = await query.order('created_at', { ascending: false })

          if (error) throw error

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'POST':
        const newPayment: Payment = await req.json()
        
        const { data, error } = await supabaseClient
          .from('payments')
          .insert({
            student_id: newPayment.student_id,
            student_name: newPayment.student_name,
            admission_no: newPayment.admission_no,
            development_fee: newPayment.development_fee,
            bus_fee: newPayment.bus_fee,
            special_fee: newPayment.special_fee,
            special_fee_type: newPayment.special_fee_type,
            total_amount: newPayment.total_amount,
            payment_date: newPayment.payment_date || new Date().toISOString(),
            added_by: newPayment.added_by,
            class: newPayment.class,
            division: newPayment.division,
          })
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        })

      case 'PUT':
        const updatedPayment: Partial<Payment> = await req.json()
        
        const updateData: any = {}
        if (updatedPayment.development_fee !== undefined) updateData.development_fee = updatedPayment.development_fee
        if (updatedPayment.bus_fee !== undefined) updateData.bus_fee = updatedPayment.bus_fee
        if (updatedPayment.special_fee !== undefined) updateData.special_fee = updatedPayment.special_fee
        if (updatedPayment.special_fee_type !== undefined) updateData.special_fee_type = updatedPayment.special_fee_type
        if (updatedPayment.total_amount !== undefined) updateData.total_amount = updatedPayment.total_amount

        const { data: updateResult, error: updateError } = await supabaseClient
          .from('payments')
          .update(updateData)
          .eq('id', paymentId)
          .select()
          .single()

        if (updateError) throw updateError

        return new Response(JSON.stringify(updateResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'DELETE':
        const { error: deleteError } = await supabaseClient
          .from('payments')
          .delete()
          .eq('id', paymentId)

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