// src/app/pages/stub.page.ts
import { Component, Input } from "@angular/core";

@Component({
  selector: "stub-page",
  template: `<div class="stub">
    <h2>{{ title }}</h2>
    <p>Страница в работе. Содержимое появится позже.</p>
  </div>`,
  styles: [`.stub { padding: 24px; color: #666; }`],
})
export class StubPage {
  @Input() title = "В разработке";
}