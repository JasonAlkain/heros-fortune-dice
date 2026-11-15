const $ = id => document.getElementById(id);

let q = 0; // Selected luck strength: 0 is fair dice, 1 is fully lucky.

const presets = [
    ['Fair', 0, '○'],
    ['Gentle', .25, '✧'],
    ['Heroic', .5, '✦'],
    ['Legendary', 1, '✷'],
];

// Roll history, kept in local storage. Invalid saved entries are dropped.
let history = [];
try {
    const saved = JSON.parse(localStorage.getItem('heros-fortune-history') || '[]');
    if (Array.isArray(saved)) {
        history = saved
            .filter(r => r
                && Number.isFinite(r.total)
                && Number.isFinite(r.time)
                && Array.isArray(r.values)
                && r.values.every(Number.isFinite)
                && typeof r.name === 'string'
                && typeof r.expression === 'string'
                && typeof r.mode === 'string')
            .slice(0, 30);
    }
} catch { }

// Reads a number input, rounds it down, and clamps it to [min, max]. Falls back to min.
function number(id, min, max) {
    const value = Number($(id).value);
    return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : min;
}

// Refreshes the luck buttons, the explanation, and the odds panel for the selected action.
function update() {
    if ($('actionLuck')) $('actionLuck').textContent = presets.find(p => p[1] === q)[0] + ' dice';

    document.querySelectorAll('.luck-option').forEach(button => {
        const on = Number(button.dataset.q) === q;
        button.classList.toggle('active', on);
        button.setAttribute('aria-pressed', on);
    });

    $('mechanic').textContent = q === 0
        ? 'Standard fair dice. Every face has the same chance before advantage or disadvantage.'
        : `Each die has a ${q * 100}% chance to roll a second candidate and keep the higher result. Both candidates stay visible in the roll details.`;

    const action = actions.find(a => a.id === $('oddsAction').value) || actions[0];
    $('oddsContent').hidden = !action;
    $('oddsEmpty').hidden = !!action;
    if (!action) return;

    const { n, mod, mode, s: sides } = action;
    const p = Dice.pmf(sides, q, mode);
    const fair = Dice.pmf(sides, 0, mode);

    $('average').textContent = p.reduce((sum, prob, i) => sum + prob * (i + 1), 0).toFixed(2);
    $('fairAverage').textContent = `${fair.reduce((sum, prob, i) => sum + prob * (i + 1), 0).toFixed(2)} with fair dice, same mode`;
    $('maxChance').textContent = (p.at(-1) * 100 + 1e-10).toFixed(2) + '%';
    $('fairMax').textContent = (fair.at(-1) * 100 + 1e-10).toFixed(2) + '% with fair dice, same mode';
    $('oddsTag').textContent = `d${sides} · ${mode}`;

    $('chart').replaceChildren(...p.map((prob, i) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = (prob / Math.max(...p) * 100) + '%';
        bar.title = `${i + 1}: ${(prob * 100).toFixed(2)}%`;
        return bar;
    }));

    const distribution = Dice.distribution(n, sides, q, mode);
    const target = number('target', -100, 1100);
    $('success').textContent = (distribution.reduce((sum, prob, i) => sum + (i + mod >= target ? prob : 0), 0) * 100).toFixed(1) + '%';
}

presets.forEach(([name, value, icon]) => {
    const button = document.createElement('button');
    button.className = 'luck-option';
    button.dataset.q = value;

    const strong = document.createElement('strong');
    strong.textContent = icon;

    button.append(strong, document.createTextNode(name));
    button.onclick = () => {
        q = value;
        update();
    };
    $('luckOptions').append(button);
});

function save() {
    try {
        localStorage.setItem('heros-fortune-history', JSON.stringify(history));
    } catch { }
}

function renderHistory() {
    $('history').replaceChildren();

    if (!history.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'No rolls yet. A good story needs a first roll.';
        $('history').append(empty);
        return;
    }

    history.forEach(r => {
        const row = document.createElement('div');
        row.className = 'history-row';

        const total = document.createElement('div');
        total.className = 'history-total';
        total.textContent = r.total;

        const desc = document.createElement('div');
        desc.textContent = r.action ? `${r.action} · ${r.expression}` : r.expression;

        const detail = document.createElement('div');
        detail.className = 'history-detail';
        detail.textContent = `[${r.values.join(', ')}] · ${r.mode}`;
        desc.append(detail);

        const luck = document.createElement('div');
        luck.className = 'history-luck';
        luck.textContent = r.name;

        const time = document.createElement('div');
        time.className = 'history-time';
        time.textContent = new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        row.append(total, desc, luck, time);
        $('history').append(row);
    });
}

$('target').addEventListener('input', update);
$('target').addEventListener('change', () => {
    $('target').value = number('target', -100, 1100);
    update();
});
$('oddsAction').addEventListener('change', update);
$('clear').onclick = () => {
    history = [];
    save();
    renderHistory();
};

// Named action setups share the selected luck strength, but roll independently.
const actionKey = 'heros-fortune-actions-v1';
const allowedSides = [4, 6, 8, 10, 12, 20, 100];
const allowedModes = ['normal', 'advantage', 'disadvantage'];

// Returns a safe copy of an action, with values clamped to allowed ranges and a new id.
function cleanAction(a) {
    return {
        id: crypto.randomUUID(),
        label: typeof a.label === 'string' ? a.label.slice(0, 50) : 'New action',
        n: Number.isInteger(a.n) ? Math.max(1, Math.min(10, a.n)) : 1,
        s: allowedSides.includes(a.s) ? a.s : 20,
        mod: Number.isInteger(a.mod) ? Math.max(-100, Math.min(100, a.mod)) : 0,
        mode: allowedModes.includes(a.mode) ? a.mode : 'normal',
    };
}

let actions = [
    { label: 'Attack', n: 1, s: 20, mod: 5 },
    { label: 'Damage', n: 1, s: 8, mod: 3 },
    { label: 'Custom action', n: 1, s: 10, mod: 3 },
].map(cleanAction);

try {
    const saved = JSON.parse(localStorage.getItem(actionKey));
    if (Array.isArray(saved)) {
        actions = saved.filter(a => a && typeof a === 'object').slice(0, 20).map(cleanAction);
    }
} catch { }

function persistActions() {
    try {
        const data = actions.map(({ label, n, s, mod, mode }) => ({ label, n, s, mod, mode }));
        localStorage.setItem(actionKey, JSON.stringify(data));
        $('actionStatus').textContent = 'Setup saved';
    } catch {
        $('actionStatus').textContent = 'Browser storage unavailable; setup lasts for this visit.';
    }
    syncOddsActions();
}

// Wraps a form control in a label with the given text.
function field(label, node) {
    const wrapper = document.createElement('label');
    wrapper.textContent = label;
    wrapper.append(node);
    return wrapper;
}

function formula(a) {
    return `${a.n}d${a.s} ${a.mod < 0 ? '−' : '+'} ${Math.abs(a.mod)}`;
}

// Clears an action's last result, so the row shows it is ready to roll again.
function resetActionResult(a, row) {
    delete a.result;
    row.querySelector('.action-total').textContent = '—';
    row.querySelector('.action-breakdown').textContent = 'Ready to roll';
    row.querySelector('.action-audit').replaceChildren();
    row.querySelector('.action-audit-details').open = false;
}

function renderActions() {
    const list = $('actionsList');
    list.replaceChildren();

    actions.forEach(a => {
        const row = document.createElement('div');
        row.className = 'action-row';
        row.dataset.actionId = a.id;

        // Name and dice settings
        const fields = document.createElement('div');
        fields.className = 'action-fields';

        const name = document.createElement('input');
        name.type = 'text';
        name.value = a.label;
        name.maxLength = 50;
        name.className = 'action-name';
        name.setAttribute('aria-label', 'Action name');
        name.addEventListener('input', () => {
            a.label = name.value;
            persistActions();
        });

        const dice = document.createElement('div');
        dice.className = 'action-dice-fields';

        // Number input. Typing updates the action once the value is valid; leaving the field clamps it.
        function numeric(key, title, min, max) {
            const input = document.createElement('input');
            input.type = 'number';
            input.value = a[key];
            input.min = min;
            input.max = max;
            input.addEventListener('input', () => {
                if (input.value !== '' && Number.isFinite(Number(input.value))) {
                    a[key] = Math.min(max, Math.max(min, Math.trunc(Number(input.value))));
                    resetActionResult(a, row);
                    persistActions();
                }
            });
            input.addEventListener('change', () => {
                const value = Number(input.value);
                a[key] = Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : min;
                input.value = a[key];
                resetActionResult(a, row);
                persistActions();
            });
            return field(title, input);
        }

        const select = document.createElement('select');
        allowedSides.forEach(s => select.add(new Option('d' + s, s)));
        select.value = a.s;
        select.onchange = () => {
            a.s = Number(select.value);
            resetActionResult(a, row);
            persistActions();
        };

        const mode = document.createElement('select');
        allowedModes.forEach(m => mode.add(new Option(m[0].toUpperCase() + m.slice(1), m)));
        mode.value = a.mode;
        mode.onchange = () => {
            a.mode = mode.value;
            resetActionResult(a, row);
            persistActions();
        };

        dice.append(numeric('n', 'Count', 1, 10), field('Die', select), numeric('mod', 'Modifier', -100, 100), field('Mode', mode));
        fields.append(name, dice);

        // Latest result
        const outcome = document.createElement('div');
        outcome.className = 'action-outcome';

        const total = document.createElement('div');
        total.className = 'action-total';
        total.setAttribute('aria-live', 'polite');
        total.textContent = a.result?.total ?? '—';

        const breakdown = document.createElement('div');
        breakdown.className = 'action-breakdown';
        breakdown.textContent = a.result?.breakdown ?? 'Ready to roll';

        outcome.append(total, breakdown);

        // Roll and remove buttons
        const buttons = document.createElement('div');
        buttons.className = 'action-buttons';

        const roll = document.createElement('button');
        roll.className = 'small-primary';
        roll.textContent = 'Roll ↗';
        roll.onclick = () => rollAction(a, row);

        const remove = document.createElement('button');
        remove.className = 'text-button';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', 'Remove action');
        remove.onclick = () => {
            actions = actions.filter(x => x !== a);
            persistActions();
            renderActions();
        };

        buttons.append(roll, remove);

        // Collapsible list of every die that was rolled
        const detail = document.createElement('details');
        detail.className = 'action-audit-details';

        const summary = document.createElement('summary');
        summary.textContent = 'Roll details';

        const audit = document.createElement('div');
        audit.className = 'action-audit';
        if (a.result) appendAudit(audit, a.result.rolls);
        else audit.textContent = 'Roll this action to see all candidate dice.';

        detail.append(summary, audit);

        row.append(fields, outcome, buttons, detail);
        list.append(row);
    });

    if (!actions.length) {
        const empty = document.createElement('p');
        empty.className = 'empty';
        empty.textContent = 'Your tray is empty. Add an action to get started.';
        list.append(empty);
    }

    $('rollAll').disabled = !actions.length;
    $('addAction').disabled = actions.length >= 20;
    syncOddsActions();
}

// Writes one line per die, showing its candidates and the value that was kept.
function appendAudit(target, rolls) {
    target.replaceChildren(...rolls.map((r, i) => {
        const div = document.createElement('div');
        const candidates = r.groups.map(g => g.dice.length === 2
            ? `luck candidates (${g.dice.join(', ')}) → ${g.value}`
            : `single candidate (${g.value})`);
        div.textContent = `Die ${i + 1}: ${candidates.join(' / ')} → kept ${r.value}`;
        return div;
    }));
}

function rollAction(a, row) {
    $('oddsAction').value = a.id;
    update();

    const rolls = Array.from({ length: a.n }, () => Dice.roll(a.s, q, a.mode));
    const values = rolls.map(r => r.value);
    const total = values.reduce((sum, v) => sum + v, 0) + a.mod;
    const name = presets.find(p => p[1] === q)[0];
    const breakdown = `[${values.join(' + ')}] ${a.mod < 0 ? '−' : '+'} ${Math.abs(a.mod)} · ${name} · ${a.mode}`;

    a.result = { total, breakdown, rolls };
    row.querySelector('.action-total').textContent = total;
    row.querySelector('.action-breakdown').textContent = breakdown;
    appendAudit(row.querySelector('.action-audit'), rolls);

    history.unshift({
        total,
        values,
        expression: formula(a),
        name,
        mode: a.mode,
        action: a.label || 'Unnamed action',
        time: Date.now(),
    });
    history = history.slice(0, 30);
    save();
    renderHistory();
}

function addAction(data) {
    if (actions.length >= 20) {
        $('actionStatus').textContent = 'Maximum 20 actions. Remove a row to add another.';
        return;
    }

    actions.push(cleanAction(data));
    persistActions();
    renderActions();
    $('actionsList').lastElementChild.querySelector('.action-name').focus();
}

$('addAction').onclick = () => addAction({ label: 'New action', n: 1, s: 20, mod: 0 });
$('rollAll').onclick = () => {
    actions.forEach(a => rollAction(a, document.querySelector(`[data-action-id="${a.id}"]`)));
    $('actionStatus').textContent = `Rolled ${actions.length} actions separately.`;
};

renderActions();
renderHistory();

// Rebuilds the action dropdown in the odds panel, keeping the current choice when it still exists.
function syncOddsActions() {
    const selected = $('oddsAction').value;
    $('oddsAction').replaceChildren(...actions.map(a => new Option(`${a.label || 'Unnamed action'} · ${formula(a)}`, a.id)));
    if (actions.some(a => a.id === selected)) $('oddsAction').value = selected;
    $('oddsAction').disabled = !actions.length;
    update();
}
