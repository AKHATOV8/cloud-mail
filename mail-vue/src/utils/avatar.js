/**
 * Deterministic avatar helpers.
 *
 * The same input always yields the same colour, so a sender keeps a stable
 * identity across sessions without any data being stored server-side.
 */

// Hand-picked hues that stay legible against white text in both themes.
const PALETTE = [
    {bg: '#2563eb', fg: '#ffffff'}, // blue
    {bg: '#7c3aed', fg: '#ffffff'}, // violet
    {bg: '#db2777', fg: '#ffffff'}, // pink
    {bg: '#dc2626', fg: '#ffffff'}, // red
    {bg: '#ea580c', fg: '#ffffff'}, // orange
    {bg: '#ca8a04', fg: '#ffffff'}, // amber
    {bg: '#16a34a', fg: '#ffffff'}, // green
    {bg: '#0d9488', fg: '#ffffff'}, // teal
    {bg: '#0891b2', fg: '#ffffff'}, // cyan
    {bg: '#4f46e5', fg: '#ffffff'}, // indigo
    {bg: '#9333ea', fg: '#ffffff'}, // purple
    {bg: '#475569', fg: '#ffffff'}, // slate
];

function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h << 5) - h + str.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

/**
 * One or two letters representing the sender.
 * Prefers the display name; falls back to the local part of the address.
 */
export function avatarText(name, email) {
    let source = (name || '').trim() || (email || '').trim();

    // Senders often have no display name, so the "name" is the address itself.
    // Splitting that on dots gives nonsense ("admin@zenyun.net" -> AN), so keep
    // only the local part before the @.
    if (source.includes('@')) {
        source = source.split('@')[0];
    }

    if (!source) return '?';

    // "John Doe" -> JD, "support" -> SU
    const words = source.split(/[\s._-]+/).filter(Boolean);

    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
}

/** Stable colour pair for a sender. */
export function avatarColor(key) {
    const seed = (key || '').trim().toLowerCase() || '?';
    return PALETTE[hash(seed) % PALETTE.length];
}

/** Ready-to-bind inline style for an avatar chip. */
export function avatarStyle(key) {
    const {bg, fg} = avatarColor(key);
    return {backgroundColor: bg, color: fg};
}
