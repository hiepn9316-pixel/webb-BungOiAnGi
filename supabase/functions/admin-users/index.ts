import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ message: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  const accessToken = authorization?.replace(/^Bearer\s+/i, '');
  if (!accessToken) return jsonResponse({ message: 'Authentication required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ message: 'Admin function is not configured.' }, 500);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerError } = await callerClient.auth.getUser(accessToken);
  if (callerError || !callerData.user) return jsonResponse({ message: 'Invalid session.' }, 401);

  const { data: callerProfile, error: profileError } = await serviceClient
    .from('profiles').select('role').eq('id', callerData.user.id).maybeSingle();
  if (profileError) return jsonResponse({ message: profileError.message }, 500);
  if (callerProfile?.role !== 'admin') return jsonResponse({ message: 'Admin access required.' }, 403);

  let payload: { action?: string; email?: string; name?: string; password?: string; role?: string; userId?: string };
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ message: 'Invalid JSON body.' }, 400);
  }

  if (payload.action === 'create') {
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    const role = payload.role === 'admin' ? 'admin' : 'customer';
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return jsonResponse({ message: 'Name, valid email, and a password of at least 8 characters are required.' }, 400);
    }

    const { data, error } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) return jsonResponse({ message: error.message }, 400);

    const { error: updateError } = await serviceClient
      .from('profiles').update({ name, email, role }).eq('id', data.user.id);
    if (updateError) {
      const { error: rollbackError } = await serviceClient.auth.admin.deleteUser(data.user.id);
      return jsonResponse({
        message: rollbackError
          ? `User was created but profile setup failed: ${updateError.message}; cleanup failed: ${rollbackError.message}`
          : `Could not finish creating the user: ${updateError.message}`,
      }, 500);
    }
    return jsonResponse({ user: { id: data.user.id, name, email, role, created_at: data.user.created_at } }, 201);
  }

  if (payload.action === 'delete') {
    const userId = String(payload.userId || '');
    if (!userId) return jsonResponse({ message: 'User ID is required.' }, 400);
    if (userId === callerData.user.id) return jsonResponse({ message: 'You cannot delete your own admin account.' }, 400);

    const { data: target, error: targetError } = await serviceClient
      .from('profiles').select('role').eq('id', userId).maybeSingle();
    if (targetError) return jsonResponse({ message: targetError.message }, 500);
    if (!target) return jsonResponse({ message: 'User not found.' }, 404);
    if (target.role === 'admin') {
      const { count, error: countError } = await serviceClient
        .from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
      if (countError) return jsonResponse({ message: countError.message }, 500);
      if ((count || 0) <= 1) return jsonResponse({ message: 'Cannot delete the last admin.' }, 400);
    }

    const { error } = await serviceClient.auth.admin.deleteUser(userId);
    if (error) return jsonResponse({ message: error.message }, 400);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ message: 'Unsupported admin user action.' }, 400);
});
