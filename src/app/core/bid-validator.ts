// src/app/core/bid-validator.ts

export type Suit = 'C' | 'D' | 'H' | 'S'; // C=трефа, D=бубна, H=черва, S=пика
export const SUITS: Suit[] = ['C', 'D', 'H', 'S'];

// ПРАВКА: явный ранг мастей для сравнения при равной длине (S > H > D > C).
// Раньше при ничьей побеждала первая встретившаяся в переборе масть (трефа) —
// отсюда баг: раздача с 5-5 ♦♣ открывалась 1♣ вместо 1♦.
export const SUIT_RANK: Record<Suit, number> = { C: 0, D: 1, H: 2, S: 3 };

export interface HandInfo {
    points: number;
    lengths: Record<Suit, number>;
}

export type Bid =
| { type: 'PASS' }
| { type: 'NT'; level: number }
| { type: 'SUIT'; level: number; suit: Suit };

export function describeBid(b: Bid): string {
    if (b.type === 'PASS') return 'пас';
    if (b.type === 'NT') return `${b.level}БК`;
    const labels: Record<Suit, string> = { C: 'трефа', D: 'бубна', H: 'черва', S: 'пика' };
    return `${b.level} ${labels[b.suit]}`;
}

function classifyHand(h: HandInfo) {
    const lens = Object.values(h.lengths).sort((a, b) => b - a);
    const pattern = lens.join('');
    const balanced = ['4333', '4432', '5332'].includes(pattern);

    let longest: Suit = 'C';
    for (const s of SUITS) {
        const longer = h.lengths[s] > h.lengths[longest];
        // ПРАВКА: при равной длине выбираем СТАРШУЮ масть (S > H > D > C),
        // а не первую встретившуюся в переборе.
        const tieButHigher =
            h.lengths[s] === h.lengths[longest] && SUIT_RANK[s] > SUIT_RANK[longest];
        if (longer || tieButHigher) longest = s;
    }
    const oneSuited = h.lengths[longest] >= 6;

    return { balanced, oneSuited, longest, pattern };
}

function minorToOpen(L: Record<Suit, number>): Suit {
    // Без изменений: правило минорок по схеме — отдельное, не «старшая при ничьей»:
    // 4-4 → 1б, 3-3 → 1т.
    if (L.D > L.C) return 'D';
    if (L.C > L.D) return 'C';
    return L.D === 4 ? 'D' : 'C'; // 4-4 → 1б, 3-3 → 1т
}

export function expectedOpening(h: HandInfo): Bid {
    const { balanced, oneSuited, longest } = classifyHand(h);
    const p = h.points;
    const L = h.lengths;

    if (balanced) {
        if (p <= 11) return { type: 'PASS' };
        // ПРАВКА: равномерная 12–14 с пятёркой ЛЮБОЙ масти — открытие 1 в этой масти.
        // В равномерных паттернах (4333, 4432, 5332) пятёрка может быть только одна,
        // поэтому достаточно найти её.
        if (p <= 14) {
            const five = (['S', 'H', 'D', 'C'] as Suit[]).find(s => L[s] === 5);
            if (five) return { type: 'SUIT', level: 1, suit: five };
            return { type: 'SUIT', level: 1, suit: minorToOpen(L) };
        }
        if (p <= 17) return { type: 'NT', level: 1 };
        if (p <= 20) return { type: 'SUIT', level: 2, suit: 'D' };
        if (p <= 22) return { type: 'NT', level: 2 };
        return { type: 'SUIT', level: 2, suit: 'C' }; // 23+ РС → сильное 2т
    }

    if (oneSuited) {
        if (p <= 5) return { type: 'PASS' };
        if (p <= 10) {
            const len = L[longest];
            const level = len === 6 ? 2 : len === 7 ? 3 : 4;
            // Блок: 6 карт → 2-й уровень, 7 → 3-й, 8+ → 4-й
            // Если это бубна и уровень 2 — по схеме блока нет, открываем 1б
            if (level === 2 && longest === 'D') {
                return { type: 'SUIT', level: 1, suit: 'D' };
            }
            return { type: 'SUIT', level, suit: longest };
        }
        if (p <= 21) return { type: 'SUIT', level: 1, suit: longest };
        return { type: 'SUIT', level: 2, suit: 'C' }; // 22+ РС → 2т
    }

    // Не равномерная и не одномастная (5-4, 5-5, 4-4-4-1 и т.п.)
    if (p <= 10) return { type: 'PASS' };
    if (p <= 21) {
        // ПРАВКА (новая): открытие 1♥/1♠ обещает ПЯТЁРКУ в мажоре.
        // Если самая длинная масть — мажор, но карт в ней меньше пяти
        // (типичный случай 4-4-4-1), открываем 1♣.
        // Бубну не трогаем: 1♦ пятёрку не обещает.
        if ((longest === 'S' || longest === 'H') && L[longest] < 5) {
            return { type: 'SUIT', level: 1, suit: 'C' };
        }
        return { type: 'SUIT', level: 1, suit: longest };
    }
    return { type: 'SUIT', level: 2, suit: 'C' };
}

function sameBid(a: Bid, b: Bid): boolean {
    if (a.type !== b.type) return false;
    if (a.type === 'PASS' || b.type === 'PASS') return true;
    if (a.type === 'NT' && b.type === 'NT') return a.level === b.level;
    if (a.type === 'SUIT' && b.type === 'SUIT')
        return a.level === b.level && a.suit === b.suit;
    return false;
}

function explainWhy(h: HandInfo): string {
    const { balanced, oneSuited, longest } = classifyHand(h);
    const p = h.points;
    const labels: Record<Suit, string> = { C: 'трефа', D: 'бубна', H: 'черва', S: 'пика' };

    if (balanced) {
        if (p <= 11) return 'Рука равномерная, 0–11 РС — по схеме пас.';
        // ПРАВКА: 12–14 с пятёркой любой масти — 1 в этой масти; иначе минорка.
        if (p <= 14) {
            const L = h.lengths;
            const five = (['S', 'H', 'D', 'C'] as Suit[]).find(s => L[s] === 5);
            if (five) {
                return `Равномерная (5-3-3-2), 12–14 РС — открытие 1 ${labels[five]} (пятёрка в масти).`;
            }
            const rule = L.C === L.D
                ? (L.C === 4 ? 'при 4-4 — бубна' : 'при 3-3 — трефа')
                : 'более длинная минорная масть';
            return `Равномерная, 12–14 РС — 1 в минорной масти (${labels[minorToOpen(L)]}; ${rule}).`;
        }
        if (p <= 17) return 'Равномерная, 15–17 РС — 1БК.';
        if (p <= 20) return 'Равномерная, 18–20 РС — 2б.';
        if (p <= 22) return 'Равномерная, 21–22 РС — 2БК.';
        // ПРАВКА (твоя, подтверждена): от 23 РС — сильное 2т. Текст согласован с expectedOpening.
        return 'Равномерная, от 23 РС — сильное 2т.';
    }
    if (oneSuited) {
        if (p <= 5) return 'Одномастная рука, 0–5 РС — пас.';
        // ПРАВКА: убрано дублирующее объявление `const len` во внешней области —
        // оно объявлялось здесь и ещё раз внутри ветки 6–10 (затенение).
        if (p <= 10) {
            const len = h.lengths[longest];
            if (longest === 'D' && len === 6) {
                return 'Одномастная бубна (6 карт), 6–10 РС — блок 2♦ схемой не предусмотрен, поэтому открытие 1♦.';
            }
            const lvl = len === 6 ? 2 : len === 7 ? 3 : 4;
            return `Одномастная (${len} карт в ${labels[longest]}), 6–10 РС — блок ${lvl} уровня.`;
        }
        if (p <= 21) return `Одномастная, 11–21 РС — обычное открытие 1 ${labels[longest]}.`;
        return 'Одномастная, 22+ РС — сильное 2т.';
    }
    if (p <= 10) return 'Неравномерная рука без длинной масти, 0–10 РС — пас.';
    if (p <= 21) {
        // ПРАВКА (новая): текст объяснения для мажора без пятёрки.
        if ((longest === 'S' || longest === 'H') && h.lengths[longest] < 5) {
            return `Неравномерная, 11–21 РС — 1♣ (1 ${labels[longest]} обещает пятёрку в мажоре, здесь её нет).`;
        }
        return `Неравномерная, 11–21 РС — открытие 1 ${labels[longest]} (самая длинная; при равной длине — старшая).`;
    }
    return 'Неравномерная, 22+ РС — сильное 2т.';
}

export interface CheckResult {
    ok: boolean;
    expected: Bid;
    message: string;
}

export function checkBid(h: HandInfo, bid: Bid): CheckResult {
    const expected = expectedOpening(h);
    if (sameBid(bid, expected)) {
        return { ok: true, expected, message: `Заявка соответствует схеме! ${h.points} PC ${explainWhy(h)}` };
    }
    return {
        ok: false,
        expected,
        message: `По схеме здесь: ${h.points} PC ${describeBid(expected)}. ${explainWhy(h)}`
    };
}
