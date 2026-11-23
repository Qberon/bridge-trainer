import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IonButton, IonContent, IonGrid, IonRow, IonCol } from "@ionic/angular";
import {
    Card, HandInfo, Bid, Suit, SUITS,
    checkResponse1H, canOpen1H,
} from "../../core/bid-validator";
import { MistakeLogService, LogContext } from "../../core/mistake-log.service"; // <-- не забудь этот импорт
import { HandEvalService } from "../../core/hand-eval.service";

interface CardVm {
    rank: string;
    red: boolean;
    suit: string;
}

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const RANK_ORDER: Record<string, number> = {
    A: 14, K: 13, Q: 12, J: 11, T: 10,
    "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2,
};

@Component({
    selector: "app-responses",
    standalone: true,
    imports: [CommonModule, FormsModule, IonButton, IonContent, IonGrid, IonRow, IonCol],
    templateUrl: "./responses.page.html",
    styleUrls: ["./responses.page.scss"],
})
export class ResponsesPage implements OnInit {
    private mistakes = inject(MistakeLogService);
    
    handInfo: HandInfo | null = null;
    openerHand: Card[] = []; // рука открывающего (пока не показываем)
    
    bidFeedback = "";
    bidOk: boolean | null = null;
    
    statsRevealed = false;
    
    selLevel: number | null = null;
    selSuit: Suit | null = null;
    selIsNT = false;
    
    private readonly ctx: LogContext = "responses";

    private evalSvc = inject(HandEvalService);
    
    readonly levels = [1, 2, 3, 4, 5, 6, 7];
    readonly suits = [
        { key: "C" as Suit, symbol: "♣" },
        { key: "D" as Suit, symbol: "♦" },
        { key: "H" as Suit, symbol: "♥" },
        { key: "S" as Suit, symbol: "♠" },
    ];
    
    get hand(): HandInfo {
        return this.handInfo!;
    }
    
    get canSubmit(): boolean {
        return this.selLevel !== null && (this.selSuit !== null || this.selIsNT);
    }
    
    ngOnInit(): void {
        this.newDeal();
    }
    
    newDeal(): void {
        do {
            const deck: Card[] = [];
            for (const s of SUITS) for (const r of RANKS) deck.push({ suit: s, rank: r });
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            this.openerHand = deck.slice(0, 13);
            this.handInfo = this.toInfo(deck.slice(13, 26));
        } while (!canOpen1H(this.toInfo(this.openerHand)));
        
        this.bidFeedback = "";
        this.bidOk = null;
        this.statsRevealed = false;
        this.selLevel = null;
        this.selSuit = null;
        this.selIsNT = false;
    }
    
    private toInfo(cards: Card[]): HandInfo {
        const lengths: Record<Suit, number> = { C: 0, D: 0, H: 0, S: 0 };
        
        for (const c of cards) {
            lengths[c.suit] += 1;
            
        }
        const points = this.evalSvc.hcp(this.toPbn(cards));
        return { points, lengths, cards };
    }
    
    /** PBN руки в порядке S.H.D.C, как в тренажёре открытий (пустая масть — пустая позиция). */
    private toPbn(cards: Card[]): string {
        const order: Suit[] = ["S", "H", "D", "C"];
        return order
        .map((s) => cards.filter((c) => c.suit === s).map((c) => c.rank).join(""))
        .join(".");
    }
    
    /** Отображение руки построчно по мастям — та же схема, что toHand в открытиях. */
    get myHand(): CardVm[][] {
        return this.toHand(this.handInfo?.cards ?? []);
    }
    
    get mistakeCount(): number { return this.mistakes.mistakeCount(this.ctx); }
    get correctCount(): number { return this.mistakes.correctCount(this.ctx); }
    
    private toHand(cards: Card[]): CardVm[][] {
        const symbols: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
        const red = new Set(["H", "D"]);
        const order = ["S", "H", "D", "C"];
        const displayRank: Record<string, string> = { T: "10" };
        return order.map((suit) => {
            const inSuit = cards
            .filter((c) => c.suit === suit)
            .sort((a, b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);
            if (inSuit.length === 0) return [{ rank: "—", red: false, suit: symbols[suit] }];
            return inSuit.map((c) => ({
                rank: displayRank[c.rank] ?? c.rank,
                red: red.has(suit),
                suit: symbols[suit],
            }));
        });
    }
    
    revealStats(): void {
        this.statsRevealed = !this.statsRevealed;
    }
    
    selectLevel(lvl: number): void {
        this.selLevel = lvl;
    }
    
    selectSuit(s: Suit): void {
        this.selSuit = s;
        this.selIsNT = false; // масть и БК взаимоисключающие
    }
    
    selectNT(): void {
        this.selIsNT = true;
        this.selSuit = null;
    }
    
    bidPass(): void {
        void this.makeBid({ type: "PASS" });
    }
    
    submitBid(): void {
        if (!this.canSubmit) return;
        const bid: Bid = this.selIsNT
        ? { type: "NT", level: this.selLevel! }
        : { type: "SUIT", level: this.selLevel!, suit: this.selSuit! };
        void this.makeBid(bid);
    }
    
    private makeBid(bid: Bid): void {
        const info = this.toInfo(this.handInfo?.cards ?? []);
        const pbn = this.toPbn(info.cards ?? []);
        const result = checkResponse1H(info, bid);
        
        if (!result.ok) {
            this.mistakes.saveMistake(this.ctx, pbn, bid, result.expected, info);
        } else {
            this.mistakes.saveCorrect(this.ctx, pbn, bid, info);
        }
        
        this.bidFeedback = result.message;
        this.bidOk = result.ok;
    }
    
    clearMistakes(): void { this.mistakes.clear(this.ctx); }
    
    /** Рука открывающего — видна только после того, как сделана заявка. */
    get openerHandVm(): CardVm[][] {
        return this.toHand(this.openerHand);
    }
    
    exportMistakes(): void {
        const mistakes = this.mistakes.getAllParsedMistakes(this.ctx);
        const correct = this.mistakes.getAllParsedCorrect(this.ctx);
        if (mistakes.length === 0 && correct.length === 0) return;
        
        const parts: string[] = [];
        
        if (mistakes.length > 0) {
            parts.push([
                ["Журнал ошибок"],
                ["Дата", "Расклад", "Ваша заявка", "По схеме", "Очки", "Формула"].join("\t"),
                ...mistakes.map((r) => [r.date, r.pbn, r.made, r.expected, r.points, r.shape].join("\t")),
            ].join("\n"));
        }
        
        if (correct.length > 0) {
            parts.push([
                ["Журнал правильных ответов"],
                ["Дата", "Расклад", "Заявка", "Очки", "Формула"].join("\t"),
                ...correct.map((r) => [r.date, r.pbn, r.bid, r.points, r.shape].join("\t")),
            ].join("\n"));
        }
        
        const text = parts.join("\n\n") + "\n";
        
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bridge-trainer-log.tsv";
        a.click();
        URL.revokeObjectURL(url);
    }
}
