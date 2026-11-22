import { Injectable } from "@angular/core";

export type Seat = "N" | "E" | "S" | "W";
export type Deal = Record<Seat, string>;

const SUITS = ["S", "H", "D", "C"];
const RANKS = "23456789TJQKA";

@Injectable({ providedIn: "root" })
export class DealGeneratorService {
  generateDeal(): Deal {
    const deck: { suit: number; rank: number }[] = [];
    SUITS.forEach((_, suit) =>
      RANKS.split("").forEach((_, rank) => deck.push({ suit, rank }))
    );

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const hands: Deal = { N: "", E: "", S: "", W: "" };
    (["N", "E", "S", "W"] as Seat[]).forEach((seat) => {
      const cards = deck.splice(0, 13);
      const bySuit: string[][] = [[], [], [], []];
      for (const { suit, rank } of cards) bySuit[suit].push(RANKS[rank]);
      bySuit.forEach((s) => s.sort((a, b) => RANKS.indexOf(b) - RANKS.indexOf(a)));
      hands[seat] = bySuit.map((s) => s.join("")).join(".");
    });
    return hands;
  }
}
