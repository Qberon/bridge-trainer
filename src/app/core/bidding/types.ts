// src/app/core/bidding/types.ts

export type Suit = 'C' | 'D' | 'H' | 'S'; // C=трефа, D=бубна, H=черва, S=пика
export const SUITS: Suit[] = ['C', 'D', 'H', 'S'];

// Ранг мастей для сравнения при равной длине (S > H > D > C).
// Раньше при ничьей побеждала первая встретившаяся в переборе масть (трефа) —
// отсюда баг: раздача с 5-5 ♦♣ открывалась 1♣ вместо 1♦.
export const SUIT_RANK: Record<Suit, number> = { C: 0, D: 1, H: 2, S: 3 };

// Названия мастей: полные — для текстов открытий, символы — для текстов ответов.
// Раньше дублировались локально в каждой explain-функции.
export const SUIT_LABELS: Record<Suit, string> = { C: 'трефа', D: 'бубна', H: 'черва', S: 'пика' };
export const SUIT_SYMBOLS: Record<Suit, string> = { C: '♣', D: '♦', H: '♥', S: '♠' };

export interface Card {
    suit: Suit;
    rank: string; // '2'..'9', 'T', 'J', 'Q', 'K', 'A'
}

// cards нужны только для ответов на 1♥: проверка «хороших пяти».
export interface HandInfo {
    points: number;
    lengths: Record<Suit, number>;
    cards?: Card[];
}

export type Bid =
| { type: 'PASS' }
| { type: 'NT'; level: number }
| { type: 'SUIT'; level: number; suit: Suit };

export interface CheckResult {
    ok: boolean;
    expected: Bid;
    message: string;
}

export function describeBid(b: Bid): string {
    if (b.type === 'PASS') return 'пас';
    if (b.type === 'NT') return `${b.level}БК`;
    return `${b.level} ${SUIT_LABELS[b.suit]}`;
}
