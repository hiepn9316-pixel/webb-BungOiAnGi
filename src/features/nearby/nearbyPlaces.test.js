import test from 'node:test';
import assert from 'node:assert/strict';
import { doesPlaceMatchDish, getCurrentPosition, serviceSearchUrl } from './nearbyPlaces.js';

test('nearby results must identify the selected dish, ignoring Vietnamese accents', () => {
  assert.equal(doesPlaceMatchDish({
    name: 'Bún bò Huế O Xuân',
    tags: { cuisine: 'vietnamese' }
  }, 'Bún Bò Huế Đặc Biệt'), true);

  assert.equal(doesPlaceMatchDish({
    name: 'Quán cà phê bên đường',
    tags: { amenity: 'cafe', cuisine: 'coffee_shop' }
  }, 'Bún Bò Huế Đặc Biệt'), false);

  assert.equal(doesPlaceMatchDish({
    name: 'Bún bò Nam Bộ',
    tags: {}
  }, 'Bún Bò Huế Đặc Biệt'), false);
});

test('dish tags can identify a restaurant even when its name is generic', () => {
  assert.equal(doesPlaceMatchDish({
    name: 'Quán ăn gia đình',
    tags: { dish: 'Cơm tấm sườn bì chả' }
  }, 'Cơm Tấm Sườn Bì Chả'), true);
});

test('denied GPS permission is reported without retrying the location request', async t => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let callCount = 0;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      geolocation: {
        getCurrentPosition(_resolve, reject) {
          callCount += 1;
          reject({ code: 1 });
        },
      },
    },
  });
  t.after(() => {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
    else delete globalThis.navigator;
  });

  await assert.rejects(getCurrentPosition(), /Bạn đã chặn quyền vị trí/);
  assert.equal(callCount, 1);
});

for (const platform of ['iOS', 'Android', 'PC']) {
  test(`delivery service links are HTTPS universal-link fallbacks on ${platform}`, () => {
    const grab = new URL(serviceSearchUrl('grab', 'bún bò Huế'));
    const shopee = new URL(serviceSearchUrl('shopee', 'bún bò Huế'));

    assert.equal(grab.protocol, 'https:');
    assert.equal(grab.hostname, 'food.grab.com');
    assert.equal(grab.searchParams.get('search'), 'bún bò Huế');
    assert.equal(shopee.protocol, 'https:');
    assert.equal(shopee.hostname, 'shopeefood.vn');
    assert.equal(shopee.searchParams.get('keyword'), 'bún bò Huế');
  });
}
