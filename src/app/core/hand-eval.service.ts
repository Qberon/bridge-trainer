import { Injectable } from "@angular/core";

const RANK_VALUE: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };
const BALANCED = new Set(["4-3-3-3", "4-4-3-2", "5-3-3-2"]);

@Injectable({ providedIn: "root" })
export class HandEvalService {
  // ПРАВКА: синглетная фигура (кроме туза) теряет 1 очко.
  // K/Q/J в синглете переоценены чистым HCP — корректируем прямо здесь,
  // чтобы truth.hcp и HandInfo.points считали одинаково.
  hcp(pbn: string): number {
    let total = 0;
    for (const cards of pbn.split(".")) {
      if (!cards) continue; // ренонс: фигур нет, поправка не нужна
      const singleton = cards.length === 1;
      for (const c of cards) {
        let value = RANK_VALUE[c] ?? 0;
        if (singleton && value > 0 && c !== "A") {
          value -= 1; // синглетная фигура K/Q/J: минус одно очко
        }
        total += value;
      }
    }
    return total;
  }

  shape(pbn: string): number[] {
    return pbn.split(".").map((s) => s.length).sort((a, b) => b - a);
  }

  isBalanced(pbn: string): boolean {
    return BALANCED.has(this.shape(pbn).join("-"));
  }
}
