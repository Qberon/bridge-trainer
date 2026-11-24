// src/app/core/bidding/common.ts
import { Bid, Card, Suit } from './types';

export function sameBid(a: Bid, b: Bid): boolean {
    if (a.type !== b.type) return false;
    if (a.type === 'PASS' || b.type === 'PASS') return true;
    if (a.type === 'NT' && b.type === 'NT') return a.level === b.level;
    if (a.type === 'SUIT' && b.type === 'SUIT')
        return a.level === b.level && a.suit === b.suit;
    return false;
}

/**
 * «Хорошие пять» РС: все пять очков в одном месте —
 * марьяж КД или Т+В в ОДНОЙ масти.
 * ПРАВКА: при suit = null пары ищем ПО КАЖДОЙ масти отдельно.
 * Раньше проверялся общий пул всех карт руки, и Т♠ + В♣ в разных
 * мастях давали ложные «хорошие пять» — гейт на 5 РС не работал.
 * Если cards не переданы, считаем пятёрку плохой — страница
 * ответов обязана передавать карты.
 */
export function isGoodFive(cards: Card[], suit: Suit | null): boolean {
    if (!cards || cards.length === 0) return false;
    const has = (pool: Card[], r: string) => pool.some(c => c.rank === r);
    const good = (pool: Card[]) =>
        (has(pool, 'K') && has(pool, 'Q')) || (has(pool, 'A') && has(pool, 'J'));

    if (suit) {
        return good(cards.filter(c => c.suit === suit));
    }
    return (['C', 'D', 'H', 'S'] as Suit[]).some(s =>
        good(cards.filter(c => c.suit === s))
    );
}
