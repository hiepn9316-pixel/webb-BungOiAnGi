const STORAGE_KEY = 'bung_service_click_stats_v1';
const SERVICES = ['maps', 'grab', 'shopee'];

function emptyCounts() {
    return Object.fromEntries(SERVICES.map(service => [service, 0]));
}

function emptyStats() {
    return {
        totals: emptyCounts(),
        byDay: {},
        byDish: {},
        updatedAt: null
    };
}

function readStats() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (!saved || typeof saved !== 'object') return emptyStats();

        const stats = emptyStats();
        for (const service of SERVICES) {
            const total = Number(saved.totals?.[service]);
            stats.totals[service] = Number.isFinite(total) && total > 0 ? total : 0;
        }
        stats.byDay = saved.byDay && typeof saved.byDay === 'object' ? saved.byDay : {};
        stats.byDish = saved.byDish && typeof saved.byDish === 'object' ? saved.byDish : {};
        stats.updatedAt = typeof saved.updatedAt === 'string' ? saved.updatedAt : null;
        return stats;
    } catch {
        return emptyStats();
    }
}

function incrementCounts(counts, service) {
    if (!counts[service]) counts[service] = 0;
    counts[service] += 1;
}

export function recordServiceClick({ service, dishId, dishName }) {
    if (!SERVICES.includes(service)) return null;

    const stats = readStats();
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const dishKey = String(dishId ?? dishName ?? 'unknown');
    const dishStats = stats.byDish[dishKey] || {
        name: dishName || 'Món không rõ',
        total: 0,
        byService: emptyCounts()
    };
    const dayStats = stats.byDay[day] || { total: 0, byService: emptyCounts() };

    stats.totals[service] += 1;
    dishStats.total += 1;
    dayStats.total += 1;
    incrementCounts(dishStats.byService, service);
    incrementCounts(dayStats.byService, service);
    stats.byDish[dishKey] = dishStats;
    stats.byDay[day] = dayStats;
    stats.updatedAt = now.toISOString();

    const retainedDays = Object.keys(stats.byDay).sort().slice(-30);
    stats.byDay = Object.fromEntries(retainedDays.map(date => [date, stats.byDay[date]]));

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
        window.dispatchEvent(new CustomEvent('service-click-stats-updated', { detail: stats }));
        return stats;
    } catch {
        return null;
    }
}

export function getServiceClickStats() {
    return readStats();
}