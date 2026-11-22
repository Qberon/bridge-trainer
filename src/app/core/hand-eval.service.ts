import { Injectable } from "@angular/core";

const RANK_VALUE: Record<string, number> = { A: 4, K: 3, Q: 2, J: 1 };
const BALANCED = new Set(["4-3-3-3", "4-4-3-2", "5-3-3-2"]);

@Injectable({ providedIn: "root" })
export class HandEvalService {
  hcp(pbn: string): number {
    return pbn
      .split(".")
      .flatMap((s) => s.split(""))
      .reduce((sum, c) => sum + (RANK_VALUE[c] ?? 0), 0);
  }

  shape(pbn: string): number[] {
    return pbn.split(".").map((s) => s.length).sort((a, b) => b - a);
  }

  isBalanced(pbn: string): boolean {
    return BALANCED.has(this.shape(pbn).join("-"));
  }
}
