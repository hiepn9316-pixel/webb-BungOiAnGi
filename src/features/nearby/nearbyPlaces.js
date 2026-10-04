import { removeVietnameseTones } from '../filters/dishFilters.js';
import { requestApi } from '../../utils/apiClient.js';

const GOOGLE_MAPS_API_KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
let googleMapsPromise;

export function getCurrentPosition() {
    if (!navigator.geolocation) {
        return Promise.reject(new Error('Trình duyệt này không hỗ trợ định vị GPS.'));
    }

    const requestPosition = options => new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });

    return requestPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 })
        .catch(error => {
            if (error.code === 1) throw error;
            return requestPosition({ enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 });
        })
        .then(({ coords }) => ({ lat: coords.latitude, lng: coords.longitude }))
        .catch(error => {
            const messages = {
                1: 'Bạn đã chặn quyền vị trí. Hãy bật quyền Location cho trang web trong cài đặt trình duyệt.',
                2: 'Trình duyệt chưa xác định được vị trí. Hãy bật quyền vị trí cho trang web và bật Wi-Fi/GPS rồi thử lại.',
                3: 'Không lấy được vị trí sau lần thử chính xác và gần đúng. Hãy bật Wi-Fi/GPS rồi thử lại.'
            };
            throw new Error(messages[error.code] || 'Không thể lấy vị trí hiện tại.');
        });
}

export async function findNearbyPlaces(location, radiusKm = 5, dishName) {
    const searchTerms = getDishSearchTerms(dishName);
    if (searchTerms.length === 0) {
        throw new Error('Chưa xác định món ăn cần tìm. Hãy chọn món rồi thử lại.');
    }

    try {
        const params = new URLSearchParams({
            lat: String(location.lat),
            lng: String(location.lng),
            radiusKm: String(radiusKm)
        });
        const data = await requestApi(`/api/nearby?${params}`);
        const places = (data.elements || [])
            .map(element => {
                const lat = Number(element.lat ?? element.center?.lat);
                const lng = Number(element.lon ?? element.center?.lon);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

                const tags = element.tags || {};
                return {
                    id: `${element.type}-${element.id}`,
                    name: tags.name,
                    lat,
                    lng,
                    address: formatAddress(tags),
                    category: tags.amenity,
                    distanceKm: distanceBetweenKm(location, { lat, lng }),
                    searchTags: tags
                };
            })
            .filter(place => place?.name && place.distanceKm <= radiusKm)
            .sort((left, right) => left.distanceKm - right.distanceKm);

        const exactMatches = places.filter(place => doesPlaceMatchDish(place, searchTerms));
        if (exactMatches.length > 0) {
            return exactMatches.slice(0, 8);
        }

        return places.slice(0, 8).map(place => ({ ...place, fallback: true }));
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('Tìm quán quá lâu. Hãy thử lại hoặc chọn bán kính nhỏ hơn.');
        if (/failed to fetch|network|load failed/i.test(error.message || '')) {
            throw new Error('Không thể kết nối dịch vụ tìm quán. Hãy thử lại sau ít phút.');
        }
        throw error;
    }
}

export function doesPlaceMatchDish(place, dishName) {
    const searchTerms = Array.isArray(dishName) ? dishName : getDishSearchTerms(dishName);
    if (!searchTerms.length) return false;

    const tags = place.searchTags || place.tags || {};
    const searchableText = [
        place.name,
        tags.name,
        tags.dish,
        tags.cuisine,
        tags.description,
        tags['food']
    ].filter(Boolean).map(removeVietnameseTones);

    return searchTerms.some(term => searchableText.some(text => text.includes(term)));
}

function getDishSearchTerms(dishName) {
    const normalizedName = removeVietnameseTones(
        typeof dishName === 'string' ? dishName : dishName?.name || ''
    );
    if (!normalizedName) return [];

    const terms = [normalizedName];
    const words = normalizedName.split(/\s+/);
    if (words.length >= 3) {
        terms.push(words.slice(0, 3).join(' '));
    }
    return [...new Set(terms)];
}

function formatAddress(tags) {
    if (tags['addr:full']) return tags['addr:full'];
    const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
    const locality = [tags['addr:suburb'], tags['addr:city'] || tags['addr:province']].filter(Boolean).join(', ');
    return [street, locality].filter(Boolean).join(', ') || 'Chưa có địa chỉ chi tiết trên bản đồ';
}

function distanceBetweenKm(from, to) {
    const radians = degrees => degrees * Math.PI / 180;
    const latitudeDelta = radians(to.lat - from.lat);
    const longitudeDelta = radians(to.lng - from.lng);
    const arc = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(longitudeDelta / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

export function googleMapsDirectionsUrl(origin, destination) {
    const params = new URLSearchParams({
        api: '1',
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        travelmode: 'walking'
    });
    return `https://www.google.com/maps/dir/?${params}`;
}

export function serviceSearchUrl(service, dishName, location) {
    const query = dishName.trim();
    if (service === 'grab') {
        return `https://food.grab.com/vn/vi/restaurants?search=${encodeURIComponent(query)}`;
    }
    if (service === 'shopee') {
        return `https://shopeefood.vn/search?keyword=${encodeURIComponent(query)}`;
    }

    const nearbyQuery = location ? `${query} near ${location.lat},${location.lng}` : query;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nearbyQuery)}`;
}

export async function renderNearbyMap(container, origin, destination = origin) {
    if (!container || !origin) return;
    const target = destination || origin;

    if (GOOGLE_MAPS_API_KEY) {
        const maps = await loadGoogleMaps();
        if (maps) {
            renderApiMap(container, maps, origin, target, Boolean(destination && destination !== origin));
            return;
        }
    }

    const params = new URLSearchParams({ hl: 'vi', q: `${target.lat},${target.lng}`, z: '15', output: 'embed' });
    container.innerHTML = `<iframe class="nearby-map-frame" title="Bản đồ Google Maps" src="https://maps.google.com/maps?${params}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
}

function loadGoogleMaps() {
    if (window.google?.maps) return Promise.resolve(window.google.maps);
    if (googleMapsPromise) return googleMapsPromise;

    googleMapsPromise = new Promise(resolve => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly`;
        script.async = true;
        script.onload = () => resolve(window.google?.maps || null);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
    });
    return googleMapsPromise;
}

function renderApiMap(container, maps, origin, destination, showRoute) {
    container.replaceChildren();
    const map = new maps.Map(container, {
        center: destination,
        zoom: showRoute ? 15 : 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });

    new maps.Marker({ map, position: origin, title: 'Vị trí của bạn', label: 'Bạn' });
    if (!showRoute) return;

    new maps.Marker({ map, position: destination, title: destination.name || 'Quán ăn' });
    const directions = new maps.DirectionsRenderer({ map, suppressMarkers: true, preserveViewport: false });
    new maps.DirectionsService().route({
        origin,
        destination,
        travelMode: maps.TravelMode.WALKING
    }, (result, status) => {
        if (status === 'OK') directions.setDirections(result);
    });
}
