import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', {
      headers: corsHeaders,
      status: 405,
    })
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
    const reportType = url.searchParams.get('type')
    const month = url.searchParams.get('month')
    const classFilter = url.searchParams.get('class')

    switch (reportType) {
      case 'class-wise':
        // Get students grouped by class
        const { data: students, error: studentsError } = await supabaseClient
          .from('students')
          .select('class, division')

        if (studentsError) throw studentsError

        // Get payments grouped by class
        const { data: payments, error: paymentsError } = await supabaseClient
          .from('payments')
          .select('class, division, development_fee, bus_fee, special_fee, total_amount')

        if (paymentsError) throw paymentsError

        // Process class-wise report
        const classReport: Record<string, any> = {}
        
        // Count students by class
        students.forEach(student => {
          const key = `${student.class}-${student.division}`
          if (!classReport[key]) {
            classReport[key] = {
              totalStudents: 0,
              totalPayments: 0,
              developmentFees: 0,
              busFees: 0,
              specialFees: 0,
              totalCollection: 0
            }
          }
          classReport[key].totalStudents++
        })

        // Sum payments by class
        payments.forEach(payment => {
          const key = `${payment.class}-${payment.division}`
          if (classReport[key]) {
            classReport[key].totalPayments++
            classReport[key].developmentFees += payment.development_fee || 0
            classReport[key].busFees += payment.bus_fee || 0
            classReport[key].specialFees += payment.special_fee || 0
            classReport[key].totalCollection += payment.total_amount || 0
          }
        })

        return new Response(JSON.stringify(classReport), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'bus-stop':
        // Get students grouped by bus stop
        const { data: busStudents, error: busError } = await supabaseClient
          .from('students')
          .select('bus_stop, bus_number, trip_number, class, division')

        if (busError) throw busError

        // Process bus stop report
        const busReport: Record<string, any> = {}
        
        busStudents.forEach(student => {
          if (!busReport[student.bus_stop]) {
            busReport[student.bus_stop] = {
              totalStudents: 0,
              students: [],
              busNumbers: new Set(),
              tripNumbers: new Set(),
              classSummary: {}
            }
          }
          
          busReport[student.bus_stop].totalStudents++
          busReport[student.bus_stop].students.push(student)
          busReport[student.bus_stop].busNumbers.add(student.bus_number)
          busReport[student.bus_stop].tripNumbers.add(student.trip_number)
          
          const classKey = `${student.class}-${student.division}`
          if (!busReport[student.bus_stop].classSummary[classKey]) {
            busReport[student.bus_stop].classSummary[classKey] = 0
          }
          busReport[student.bus_stop].classSummary[classKey]++
        })

        // Convert Sets to Arrays for JSON serialization
        Object.keys(busReport).forEach(stop => {
          busReport[stop].busNumbers = Array.from(busReport[stop].busNumbers)
          busReport[stop].tripNumbers = Array.from(busReport[stop].tripNumbers)
        })

        return new Response(JSON.stringify(busReport), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'monthly':
        if (!month) {
          throw new Error('Month parameter is required for monthly reports')
        }

        // Get payments for the specified month
        const startDate = `${month}-01T00:00:00`
        const endDate = `${month}-31T23:59:59`

        const { data: monthlyPayments, error: monthlyError } = await supabaseClient
          .from('payments')
          .select('development_fee, bus_fee, special_fee, total_amount, payment_date')
          .gte('payment_date', startDate)
          .lte('payment_date', endDate)

        if (monthlyError) throw monthlyError

        // Process monthly report
        const monthlyReport = {
          totalPayments: monthlyPayments.length,
          developmentFees: monthlyPayments.reduce((sum, p) => sum + (p.development_fee || 0), 0),
          busFees: monthlyPayments.reduce((sum, p) => sum + (p.bus_fee || 0), 0),
          specialFees: monthlyPayments.reduce((sum, p) => sum + (p.special_fee || 0), 0),
          totalCollection: monthlyPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0),
          dailyBreakdown: monthlyPayments.reduce((acc: Record<string, number>, payment) => {
            const date = new Date(payment.payment_date).toLocaleDateString()
            acc[date] = (acc[date] || 0) + (payment.total_amount || 0)
            return acc
          }, {})
        }

        return new Response(JSON.stringify(monthlyReport), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'summary':
        // Get overall summary statistics
        const { data: allStudents, error: allStudentsError } = await supabaseClient
          .from('students')
          .select('id')

        if (allStudentsError) throw allStudentsError

        const { data: allPayments, error: allPaymentsError } = await supabaseClient
          .from('payments')
          .select('total_amount, payment_date')

        if (allPaymentsError) throw allPaymentsError

        const today = new Date().toISOString().split('T')[0]
        const todayPayments = allPayments.filter(p => 
          p.payment_date.startsWith(today)
        )

        const summary = {
          totalStudents: allStudents.length,
          totalPayments: allPayments.length,
          totalCollection: allPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0),
          todayPayments: todayPayments.length,
          todayCollection: todayPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0)
        }

        return new Response(JSON.stringify(summary), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        throw new Error('Invalid report type. Supported types: class-wise, bus-stop, monthly, summary')
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})