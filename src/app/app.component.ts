// src/app/app.component.ts
import { Component } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular";
//import { RouterOutlet } from "@angular/router";
import { ShellComponent } from "./shell/shell.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  imports: [
    IonApp,
    IonRouterOutlet,
    //RouterOutlet,
    ShellComponent,  // ← вот его не хватало
  ],
})
export class AppComponent {}
