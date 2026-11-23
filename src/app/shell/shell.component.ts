import { Component } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { IonRouterOutlet } from "@ionic/angular";

@Component({
  selector: "app-shell",
  templateUrl: "./shell.component.html",
  styleUrl: "./shell.component.css",
  imports: [IonRouterOutlet, RouterLink, RouterLinkActive],
})
export class ShellComponent {
  drawerOpen = false;
}
