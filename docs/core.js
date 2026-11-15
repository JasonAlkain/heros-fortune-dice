(function (root) {
    function cdf(k, s, q, mode = 'normal') { let f = (1 - q) * k / s + q * (k / s) ** 2; return mode === 'advantage' ? f * f : mode === 'disadvantage' ? 1 - (1 - f) ** 2 : f; }
    function pmf(s, q, mode) { return Array.from({ length: s }, (_, i) => cdf(i + 1, s, q, mode) - cdf(i, s, q, mode)); }
    function distribution(n, s, q, mode) { let d = [1], p = pmf(s, q, mode); for (let j = 0; j < n; j++) { let next = Array(d.length + s).fill(0); d.forEach((a, i) => p.forEach((b, k) => next[i + k + 1] += a * b)); d = next; } return d; }
    function unit() { let a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; }
    function die(s) { return 1 + Math.floor(unit() * s); }
    function lucky(s, q) { let a = die(s); if (unit() < q) { let b = die(s); return { value: Math.max(a, b), dice: [a, b] }; } return { value: a, dice: [a] }; }
    function roll(s, q, mode) { let a = lucky(s, q); if (mode === 'normal') return { value: a.value, groups: [a] }; let b = lucky(s, q); return { value: mode === 'advantage' ? Math.max(a.value, b.value) : Math.min(a.value, b.value), groups: [a, b] }; }
    let api = { cdf, pmf, distribution, roll }; if (typeof module !== 'undefined') module.exports = api; else root.Dice = api;
})(globalThis);
