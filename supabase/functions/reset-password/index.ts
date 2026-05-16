import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) throw new Error('Not authenticated')

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()
    if (!callerProfile || callerProfile.role !== 'admin') {
      throw new Error('Only admins can reset passwords')
    }

    // Get target user ID and new password
    const { user_id, new_password } = await req.json()
    if (!user_id || !new_password) throw new Error('Missing user_id or new_password')
    if (new_password.length < 6) throw new Error('Password must be at least 6 characters')

    // Reset password using service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { error } = await adminClient.auth.admin.updateUserById(user_id, {
      password: new_password
    })
    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, message: 'Password updated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
