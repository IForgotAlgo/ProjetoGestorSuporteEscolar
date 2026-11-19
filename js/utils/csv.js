export function escapeCsvValue(value) {
    let text = String(value ?? '');
    if(/^[=+\-@]/.test(text)) text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
}
