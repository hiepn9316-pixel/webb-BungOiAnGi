import test from 'node:test';
import assert from 'node:assert/strict';
import { fromDatabaseDish, toDatabaseDish } from './supabaseData.js';

test('Supabase dish rows map description to the app dish shape', () => {
  const row = { id: 4, name: 'Phở', description: 'Nóng', price: 45000, moods: ['ngon'] };
  const dish = fromDatabaseDish(row);

  assert.equal(dish.desc, 'Nóng');
  assert.equal(dish.description, 'Nóng');
  assert.equal(dish.id, 4);
});

test('app dishes map description back to the Supabase schema', () => {
  const row = toDatabaseDish({ id: 4, name: 'Phở', desc: 'Nóng', price: 45000, moods: ['ngon'] });

  assert.equal(row.id, 4);
  assert.equal(row.description, 'Nóng');
  assert.equal('desc' in row, false);
});
