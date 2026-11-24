// src/app/core/bidding/opening.ts
import { Bid, CheckResult, HandInfo, SUITS, SUIT_LABELS, SUIT_RANK, Suit, describeBid } from './types';
import { sameBid } from './common';

export function classifyHand(h: HandInfo) {
    const lens = Object.values(h.lengths).sort((a, b) => b - a);
    const pattern = lens.join('');
    const balanced = ['4333', '4432', '5332'].includes(pattern);

    let longest: Suit = 'C';
    for (const s of SUITS) {
        const longer = h.lengths[s] > h.lengths[longest];
        // При равной длине выбираем СТАРШУЮ масть (S > H > D > C),
        // а не первую встретившуюся в переборе.
        const tieButHigher =
        h.lengths[s] === h.lengths[longest] && SUIT_RANK[s] > SUIT_RANK[longest];
        if (longer || tieButHigher) longest = s;
    }
    const oneSuited = h.lengths[longest] >= 6;

    return { balanced, oneSuited, longest, pattern };
}

export function minorToOpen(L: Record<Suit, number>): Suit {
    // Правило минорок ОТКРЫТИЙ — отдельное, не «старшая при ничьей»:
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
        // Равномерная 12–14 с пятёркой ЛЮБОЙ масти — открытие 1 в этой масти.
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
        // Открытие 1♥/1♠ обещает ПЯТЁРКУ в мажоре. Если самая длинная масть —
        // мажор, но карт в ней меньше пяти (типичный случай 4-4-4-1),
        // открываем 1♣. Бубну не трогаем: 1♦ пятёрку не обещает.
        if ((longest === 'S' || longest === 'H') && L[longest] < 5) {
            return { type: 'SUIT', level: 1, suit: minorToOpen(L) };
        }
        return { type: 'SUIT', level: 1, suit: longest };
    }
    return { type: 'SUIT', level: 2, suit: 'C' };
}

export function explainWhy(h: HandInfo): string {
    const { balanced, oneSuited, longest } = classifyHand(h);
    const p = h.points;
    const labels = SUIT_LABELS;

    if (balanced) {
        if (p <= 11) return 'Рука равномерная, 0–11 РС — по схеме пас.';
        // 12–14 с пятёркой любой масти — 1 в этой масти; иначе минорка.
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
        return 'Равномерная, от 23 РС — сильное 2т.';
    }
    if (oneSuited) {
        if (p <= 5) return 'Одномастная рука, 0–5 РС — пас.';
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
        if ((longest === 'S' || longest === 'H') && h.lengths[longest] < 5) {
            const L = h.lengths;
            const rule = L.C === L.D
            ? (L.C === 4 ? 'минорки 4-4 — старшая (бубна)' : 'минорки 3-3 — трефа')
            : 'более длинная минорная масть';
            return `Неравномерная, 11–21 РС — 1 ${labels[minorToOpen(L)]} (1 ${labels[longest]} обещает пятёрку в мажоре, здесь её нет; ${rule}).`;
        }
        return `Неравномерная, 11–21 РС — открытие 1 ${labels[longest]} (самая длинная; при равной длине — старшая).`;
    }
    return 'Неравномерная, 22+ РС — сильное 2т.';
}

export function checkBid(h: HandInfo, bid: Bid): CheckResult {
    const expected = expectedOpening(h);
    if (sameBid(bid, expected)) {
        return { ok: true, expected, message: `Заявка соответствует схеме! ${h.points} РС ${explainWhy(h)}` };
    }
    return {
        ok: false,
        expected,
        message: `По схеме здесь: ${h.points} РС ${describeBid(expected)}. ${explainWhy(h)}`
    };
}
