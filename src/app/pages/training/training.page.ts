import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  IonButton, IonContent, IonHeader, IonTitle, IonToolbar,
  IonItem, IonInput, IonLabel, IonCheckbox,
  IonGrid, IonRow, IonCol, IonItemDivider,
} from "@ionic/angular";
import { ToastController } from "@ionic/angular";
import { DealGeneratorService, Deal } from "../../core/deal-generator.service";
import { HandEvalService } from "../../core/hand-eval.service";
import { checkBid, HandInfo, Bid, Suit } from "../../core/bid-validator";


interface CardVm {
  rank: string;
  red: boolean;
  suit: string;
}

@Component({
  selector: "app-training",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton, IonContent, IonHeader, IonTitle, IonToolbar,
    IonItem, IonInput, IonLabel, IonCheckbox,
    IonGrid, IonRow, IonCol,
  ],
  templateUrl: "./training.page.html",
  styleUrls: ["./training.page.scss"],
})
export class TrainingPage {
  private dealGen = inject(DealGeneratorService);
  private evalSvc = inject(HandEvalService);
  private toastCtrl = inject(ToastController);

  deal: Deal = this.dealGen.generateDeal();
  hcpAnswer: string = "";      // храним как строку, парсим при проверке
  balAnswer: boolean = false;  // чекбокс сразу даёт boolean
  bidFeedback: string = "";
  bidOk: boolean | null = null;

  get myHand(): CardVm[][] {
    return this.toHand(this.deal.S);
  }

  get truth(): { hcp: number; balanced: boolean; shape: string } {
    const pbn = this.deal.S;
    return {
      hcp: this.evalSvc.hcp(pbn),
      balanced: this.evalSvc.isBalanced(pbn),
      shape: this.evalSvc.shape(pbn).join("-"),
    };
  }

  newDeal(): void {
    this.deal = this.dealGen.generateDeal();
    this.hcpAnswer = "";
    this.balAnswer = false;
    this.bidFeedback = "";
    this.bidOk = null;
    this.selLevel = null;
    this.selSuit = null;
    this.selIsNT = false;
  }

  bid(bid: Bid): void { void this.makeBid(bid); }

  private toHandInfo(): HandInfo {
    const parts = this.deal.S.split("."); // [S, H, D, C] — тот же порядок, что в toHand
    return {
      points: this.evalSvc.hcp(this.deal.S),
      lengths: {
        S: parts[0].length,
        H: parts[1].length,
        D: parts[2].length,
        C: parts[3].length,
      },
    };
  }

  async makeBid(bid: Bid): Promise<void> {
    const result = checkBid(this.toHandInfo(), bid);
    this.bidFeedback = result.message;
    this.bidOk = result.ok;
    //await this.presentToast(result.message, result.ok ? "success" : "danger");
  }

  async check(): Promise<void> {
    const hcp = Number(this.hcpAnswer);
    const truth = this.truth;

    // Проверка: число валидно и совпадает, и расклад совпадает
    const isCorrect = !isNaN(hcp) && hcp === truth.hcp && this.balAnswer === truth.balanced;

    const message = isCorrect
      ? "🎉 Верно! Отличная работа!"
      : `❌ Ошибка. На самом деле: ${truth.hcp} HCP, форма ${truth.shape}, ${truth.balanced ? "равномерный" : "неравномерный"}`;

    await this.presentToast(message, isCorrect ? "success" : "danger");
  }

  async presentToast(message: string, color: "success" | "danger" = "success"): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      position: "middle",
      color, // Ionic сам покрасит тост в зелёный или красный
    });
    await toast.present();
  }

  private toHand(pbn: string): CardVm[][] {
    const symbols: Record<string, string> = { S: "\u2660", H: "\u2665", D: "\u2666", C: "\u2663" };
    const red = new Set(["H", "D"]);
    const order = ["S", "H", "D", "C"];
    const displayRank: Record<string, string> = { T: "10" };
    return pbn.split(".").map((cards, i) => {
      const suit = order[i];
      if (!cards) return [{ rank: "\u2014", red: false, suit: symbols[suit] }];
      return cards.split("").map((rank) => ({ rank: displayRank[rank] ?? rank, red: red.has(suit), suit: symbols[suit] }));
    });
  }

  selLevel: number | null = null;
  selSuit: Suit | null = null;
  selIsNT = false;

  readonly levels = [1, 2, 3, 4, 5, 6, 7];
  readonly suits = [
    { key: 'C' as Suit, symbol: '♣' },
    { key: 'D' as Suit, symbol: '♦' },
    { key: 'H' as Suit, symbol: '♥' },
    { key: 'S' as Suit, symbol: '♠' },
  ];

  // Заявку можно отправить только с полным набором: уровень + масть или уровень + БК
  get canSubmit(): boolean {
    return this.selLevel !== null && (this.selSuit !== null || this.selIsNT);
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
    // Пас отправляется сразу, без кнопки «Заявка»
    void this.makeBid({ type: 'PASS' });
  }

  submitBid(): void {
    if (!this.canSubmit) return;
    const bid: Bid = this.selIsNT
      ? { type: 'NT', level: this.selLevel! }
      : { type: 'SUIT', level: this.selLevel!, suit: this.selSuit! };
    void this.makeBid(bid);
  }

}
