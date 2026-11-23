import { Injectable } from "@angular/core";
import { Bid, describeBid, HandInfo } from "./bid-validator";

export type LogContext = "openings" | "responses";

export interface MistakeRecord {
  date: string; pbn: string; made: string; expected: string;
  points: string; shape: string;
}

export interface CorrectRecord {
  date: string; pbn: string; bid: string;
  points: string; shape: string;
}

@Injectable({ providedIn: "root" })
export class MistakeLogService {
  private key(kind: "mistakes" | "correct", ctx: LogContext): string {
    return `bridge-trainer.${kind}.${ctx}`;
  }

  // --- ошибки ---
  saveMistake(ctx: LogContext, dealPbn: string, madeBid: Bid, expected: Bid, hand: HandInfo): void {
    this.append(this.key("mistakes", ctx), JSON.stringify([
      new Date().toISOString(),
      dealPbn,
      describeBid(madeBid),
      describeBid(expected),
      `${hand.points} РС`,
      Object.values(hand.lengths).sort((a, b) => b - a).join("-"),
    ]));
  }

  // --- правильные ответы ---
  saveCorrect(ctx: LogContext, dealPbn: string, bid: Bid, hand: HandInfo): void {
    this.append(this.key("correct", ctx), JSON.stringify([
      new Date().toISOString(),
      dealPbn,
      describeBid(bid),
      `${hand.points} РС`,
      Object.values(hand.lengths).sort((a, b) => b - a).join("-"),
    ]));
  }

  private append(key: string, line: string): void {
    const arr = this.readRaw(key);
    arr.push(line);
    try {
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      console.warn("Не удалось сохранить журнал:", e);
    }
  }

  private readRaw(key: string): string[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  getAllMistakes(ctx: LogContext): string[] {
    return this.readRaw(this.key("mistakes", ctx));
  }

  getAllCorrect(ctx: LogContext): string[] {
    return this.readRaw(this.key("correct", ctx));
  }

  getAllParsedMistakes(ctx: LogContext): MistakeRecord[] {
    return this.getAllMistakes(ctx).map(line => {
      try {
        const [date, pbn, made, expected, points, shape] = JSON.parse(line);
        return { date, pbn, made, expected, points, shape };
      } catch { return null; }
    }).filter(Boolean) as MistakeRecord[];
  }

  getAllParsedCorrect(ctx: LogContext): CorrectRecord[] {
    return this.getAllCorrect(ctx).map(line => {
      try {
        const [date, pbn, bid, points, shape] = JSON.parse(line);
        return { date, pbn, bid, points, shape };
      } catch { return null; }
    }).filter(Boolean) as CorrectRecord[];
  }

  // Очистка журналов одного контекста
  clear(ctx: LogContext): void {
    localStorage.removeItem(this.key("mistakes", ctx));
    localStorage.removeItem(this.key("correct", ctx));
  }

  mistakeCount(ctx: LogContext): number { return this.getAllMistakes(ctx).length; }
  correctCount(ctx: LogContext): number { return this.getAllCorrect(ctx).length; }
}
