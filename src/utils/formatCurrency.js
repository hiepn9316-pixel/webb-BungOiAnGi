const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0
});

export function formatCurrency(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return '0đ';
    return `${VND_FORMATTER.format(value)}đ`;
}