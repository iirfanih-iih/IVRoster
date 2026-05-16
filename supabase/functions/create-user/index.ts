// Edge Function: create-user
// This runs on Supabase's servers (not in the browser)
// It has access to the SERVICE_ROLE_KEY which can create users directly

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// CORS headers — allows your GitHub Pages site to call this function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request (browser sends this before the actual request)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ─── Step 1: Get the caller's auth token from the request header ───
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header — you must be logged in')

    // ─── Step 2: Get environment variables (automatically set by Supabase) ───
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // ─── Step 3: Verify the caller is an admin ───
    // Create a client using the CALLER's token (not the service role)
    // This ensures we check THEIR permissions, not ours
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) throw new Error('Invalid session — please log in again')

    // Look up their profile to check if they're admin
    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      throw new Error('Access denied — only admins can create users')
    }

    // ─── Step 4: Parse the request body (the new user's details) ───
    const { email, password, name, role, team } = await req.json()

    // Validate required fields
    if (!email || !password || !name || !role) {
      throw new Error('Missing required fields: email, password, name, role')
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }
    if (!['admin', 'team_leader', 'viewer'].includes(role)) {
      throw new Error('Invalid role — must be admin, team_leader, or viewer')
    }

    // ─── Step 5: Create the user using the SERVICE ROLE KEY ───
    // This is the powerful key that can create users without email confirmation
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // Instantly confirmed — no email needed
      user_metadata: { name }
    })

    if (createErr) throw createErr
    if (!newUser.user) throw new Error('User creation returned no user object')

    // ─── Step 6: Insert their profile (role, team, etc.) ───
    const { error: profileErr } = await adminClient.from('profiles').insert({
      id: newUser.user.id,
      email,
      name,
      role,
      team: team || null
    })

    if (profileErr) throw profileErr

    // ─── Step 7: Return success ───
    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUser.user.id,
        message: `User ${name} (${email}) created with role: ${role}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (e) {
    // ─── Error handling ───
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
