import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  IonButton, IonContent, IonHeader, IonTitle, IonToolbar,
  IonItem, IonInput, IonLabel, IonCheckbox,
} from "@ionic/angular";
import { ToastController } from "@ionic/angular";
import { DealGeneratorService, Deal } from "../../core/deal-generator.service";
import { HandEvalService } from "../../core/hand-eval.service";

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
      position: "bottom",
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
}
