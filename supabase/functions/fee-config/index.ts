import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface FeeConfig {
  id?: string
  config_type: string
  config_key: string
  config_value: number
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

    switch (req.method) {
      case 'GET':
        const configType = url.searchParams.get('type')
        
        let query = supabaseClient.from('fee_config').select('*')
        
        if (configType) {
          query = query.eq('config_type', configType)
        }

        const { data, error } = await query.order('config_type').order('config_key')

        if (error) throw error

        // Transform data into the expected format
        const result = {
          developmentFees: {} as Record<string, number>,
          busStops: {} as Record<string, number>
        }

        data.forEach((config: FeeConfig) => {
          if (config.config_type === 'development_fee') {
            result.developmentFees[config.config_key] = config.config_value
          } else if (config.config_type === 'bus_stop') {
            result.busStops[config.config_key] = config.config_value
          }
        })

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'POST':
      case 'PUT':
        const configData = await req.json()
        
        const updates: FeeConfig[] = []

        // Process development fees
        if (configData.developmentFees) {
          Object.entries(configData.developmentFees).forEach(([key, value]) => {
            updates.push({
              config_type: 'development_fee',
              config_key: key,
              config_value: value as number
            })
          })
        }

        // Process bus stops
        if (configData.busStops) {
          Object.entries(configData.busStops).forEach(([key, value]) => {
            updates.push({
              config_type: 'bus_stop',
              config_key: key,
              config_value: value as number
            })
          })
        }

        // Upsert all configurations
        const results = []
        for (const update of updates) {
          const { data, error } = await supabaseClient
            .from('fee_config')
            .upsert(update, {
              onConflict: 'config_type,config_key'
            })
            .select()

          if (error) throw error
          results.push(data)
        }

        return new Response(JSON.stringify({ success: true, updated: results.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'DELETE':
        const deleteType = url.searchParams.get('type')
        const deleteKey = url.searchParams.get('key')

        if (!deleteType || !deleteKey) {
          throw new Error('Both type and key parameters are required for deletion')
        }

        const { error: deleteError } = await supabaseClient
          .from('fee_config')
          .delete()
          .eq('config_type', deleteType)
          .eq('config_key', deleteKey)

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