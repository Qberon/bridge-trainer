// src/app/app.routes.ts
import { Routes } from "@angular/router";
import { TrainingPage } from "./pages/training/training.page";
import { StubPage } from "./pages/stub.page";
import { ResponsesPage } from "./pages/responses/responses.page";

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "training" },
  { path: "training", component: TrainingPage },     // тренировка открытий — то, что есть сейчас
  { path: "responses", component: ResponsesPage },
  { path: "stats", component: StubPage },            // журнал ошибок и TSV — позже
  { path: "**", redirectTo: "training" },
];