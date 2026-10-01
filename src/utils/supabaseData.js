import { dishes as starterDishes } from '../data/dishes.js';
import { supabase } from './supabase.js';

function requireSupabase() {
  if (!supabase) throw new Error('Chưa cấu hình Supabase.');
  return supabase;
}

function throwIfError({ error }) {
  if (error) throw new Error(error.message);
}

export function fromDatabaseDish(dish) {
  return {
    ...dish,
    desc: dish.description,
  };
}

export function toDatabaseDish(dish) {
  const { id, desc, ...rest } = dish;
  return {
    ...(id === undefined ? {} : { id }),
    ...rest,
    description: desc || '',
  };
}

export async function fetchSupabaseDishes() {
  const client = requireSupabase();
  const { data, error } = await client.from('dishes').select('*').order('id');
  if (error) throw new Error(error.message);
  return (data || []).map(fromDatabaseDish);
}

export async function loadAdminData() {
  const client = requireSupabase();
  const [dishesResult, profilesResult, favoritesResult, historyResult] = await Promise.all([
    client.from('dishes').select('*').order('id'),
    client.from('profiles').select('id,name,email,role,created_at').order('created_at', { ascending: false }),
    client.from('favorites').select('dish_id', { count: 'exact' }),
    client.from('history').select('id,dish_id', { count: 'exact' }),
  ]);
  for (const result of [dishesResult, profilesResult, favoritesResult, historyResult]) throwIfError(result);

  const remoteDishes = (dishesResult.data || []).map(fromDatabaseDish);
  if (!remoteDishes.length && starterDishes.length) {
    const seedRows = starterDishes.map(dish => {
      const { id: _id, ...row } = toDatabaseDish(dish);
      return row;
    });
    const { error } = await client.from('dishes').upsert(seedRows, { onConflict: 'name', ignoreDuplicates: true });
    if (error) throw new Error(`Không thể khởi tạo danh sách món: ${error.message}`);
    return loadAdminData();
  }

  const favoritesByDish = new Map();
  for (const row of favoritesResult.data || []) {
    favoritesByDish.set(row.dish_id, (favoritesByDish.get(row.dish_id) || 0) + 1);
  }
  const viewsByDish = new Map();
  for (const row of historyResult.data || []) {
    viewsByDish.set(row.dish_id, (viewsByDish.get(row.dish_id) || 0) + 1);
  }
  const hotDishes = remoteDishes.map(dish => ({
    id: dish.id,
    name: dish.name,
    img: dish.img,
    favorites: favoritesByDish.get(dish.id) || 0,
    views: viewsByDish.get(dish.id) || 0,
  })).sort((left, right) => (right.favorites * 2 + right.views) - (left.favorites * 2 + left.views)).slice(0, 5);

  return {
    dishes: remoteDishes,
    users: profilesResult.data || [],
    stats: {
      userCount: profilesResult.data?.length || 0,
      dishCount: remoteDishes.length,
      favoriteCount: favoritesResult.count || 0,
      historyCount: historyResult.count || 0,
      hotDishes,
    },
  };
}

export async function saveSupabaseDish(dish, editingId) {
  const client = requireSupabase();
  const query = editingId
    ? client.from('dishes').update(toDatabaseDish(dish)).eq('id', editingId)
    : client.from('dishes').insert(toDatabaseDish(dish));
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function deleteSupabaseDish(id) {
  const { error } = await requireSupabase().from('dishes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function saveSupabaseProfile({ id, name, role }) {
  const { data, error } = await requireSupabase().rpc('admin_update_profile', {
    target_user_id: id,
    new_name: name ?? null,
    new_role: role ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function createSupabaseUser(user) {
  const { data, error } = await requireSupabase().functions.invoke('admin-users', {
    body: { action: 'create', ...user },
  });
  if (error) throw new Error(error.message);
  if (data?.message) throw new Error(data.message);
  return data.user;
}

export async function deleteSupabaseUser(userId) {
  const { data, error } = await requireSupabase().functions.invoke('admin-users', {
    body: { action: 'delete', userId },
  });
  if (error) throw new Error(error.message);
  if (data?.message) throw new Error(data.message);
}

export async function loadSupabaseProfile(userId) {
  const { data, error } = await requireSupabase()
    .from('profiles').select('id,name,email,role,created_at').eq('id', userId).single();
  if (error) throw new Error(error.message);
  return { ...data, createdAt: data.created_at };
}

export async function updateSupabaseProfileName(name) {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw new Error(authError.message);
  const userId = authData.user?.id;
  if (!userId) throw new Error('Phiên đăng nhập không hợp lệ.');

  const { data, error } = await client.from('profiles').update({ name }).eq('id', userId)
    .select('id,name,email,role,created_at').single();
  if (error) throw new Error(error.message);
  return { ...data, createdAt: data.created_at };
}

export async function loadSupabaseFavorites() {
  const { data, error } = await requireSupabase().from('favorites').select('dish_id');
  if (error) throw new Error(error.message);
  return (data || []).map(row => Number(row.dish_id));
}

export async function saveSupabaseFavorites(dishIds) {
  const { error } = await requireSupabase().rpc('replace_my_favorites', {
    dish_ids: [...new Set(dishIds.map(Number))],
  });
  if (error) throw new Error(error.message);
}

export async function recordSupabaseHistory(dishId) {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) throw new Error(authError.message);
  if (!authData.user) throw new Error('Phiên đăng nhập không hợp lệ.');
  const { error } = await client.from('history').insert({ user_id: authData.user.id, dish_id: dishId });
  if (error) throw new Error(error.message);
}

export async function loadSupabaseProfileActivity(userId) {
  const client = requireSupabase();
  const [favoritesResult, historyResult] = await Promise.all([
    client.from('favorites').select('dish_id').eq('user_id', userId),
    client.from('history').select('id,dish_id,viewed_at').eq('user_id', userId)
      .order('viewed_at', { ascending: false }).limit(50),
  ]);
  throwIfError(favoritesResult);
  throwIfError(historyResult);
  const history = (historyResult.data || []).map(item => ({
    ...item,
    dishId: item.dish_id,
    viewedAt: item.viewed_at,
    dish: null,
  }));
  const dishIds = new Set(history.map(item => Number(item.dishId)));
  const { data: historyDishes, error } = dishIds.size
    ? await client.from('dishes').select('id,name').in('id', [...dishIds])
    : { data: [], error: null };
  if (error) throw new Error(error.message);
  const dishesById = new Map((historyDishes || []).map(dish => [Number(dish.id), dish]));
  for (const item of history) item.dish = dishesById.get(Number(item.dishId)) || null;

  return {
    favorites: (favoritesResult.data || []).map(item => Number(item.dish_id)),
    history,
  };
}
