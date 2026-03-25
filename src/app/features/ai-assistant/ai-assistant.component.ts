import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Component, signal, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DataService } from '../../core/services/data.service';

interface Message { role: 'user'|'assistant'; content: string; error?: boolean; }

const SYS = `You are the AI maintenance strategy assistant for Cordant Energy, an O&G and chemical plant operator. You have full access to the plant data: 500 assets across 4 plants, 22 equipment sub-classes (pumps, motors, transmitters, switches, breakers, valves), 5775 work orders, 97 RCM-based strategies. Key KPIs: Schedule compliance 87.4%, MTBF 312 days, MTTR 4.2h, Backlog 84h. EMS data: Total energy cost $2.84M YTD, electricity 4.82 GWh. Water: 142,400 m³ withdrawn, 27.1% recycled. Answer as a senior reliability engineer, concise, max 4 paragraphs.`;

@Component({
  selector: 'ce-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatIconModule, PageHeaderComponent],
  template: `
    <ce-page-header title="AI Assistant" subtitle="MAINTENANCE STRATEGY ADVISOR · POWERED BY CLAUDE"
      highlight="CORDANT ENERGY DATA" (exportXlsx)="exportChat()" (exportPdf)="exportChat()">
    </ce-page-header>

    <div class="ai-banner">
      <div class="banner-icon">⬡</div>
      <div>
        <div class="banner-title">Cordant Energy maintenance data is loaded.</div>
        <div class="banner-sub">500 assets · 22 sub-classes · 5,775 WOs · 97 RCM strategies</div>
      </div>
      <div class="banner-status" *ngIf="busy()"><span class="thinking-dot"></span> THINKING…</div>
    </div>

    <!-- FAQ chips -->
    <div class="faq-row">
      <button class="faq-chip" *ngFor="let q of faqs" (click)="askFaq(q)">{{ q }}</button>
    </div>

    <!-- Chat -->
    <mat-card class="chat-card">
      <div class="chat-messages" #scrollRef>
        <div *ngFor="let m of messages()" class="bubble" [ngClass]="m.role">
          <div class="sender">{{ m.role === 'user' ? 'You' : m.error ? 'SETUP NEEDED' : 'CORDANT AI' }}</div>
          <div class="msg-text" [innerHTML]="formatMsg(m.content)"></div>
        </div>
        <div class="thinking" *ngIf="busy()">
          <div class="sender">CORDANT AI</div>
          <span>Analysing…</span>
        </div>
      </div>
      <div class="input-row">
        <mat-form-field appearance="outline" style="flex:1">
          <input matInput [(ngModel)]="input" placeholder="Ask about maintenance strategies, assets, work orders, energy…"
            (keydown.enter)="send()" [disabled]="busy()">
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="send()" [disabled]="busy() || !input.trim()">
          <mat-icon>send</mat-icon>
        </button>
        <button mat-stroked-button (click)="clear()">Clear</button>
      </div>
    </mat-card>
  `,
  styles: [`:host{display:flex;flex-direction:column;gap:14px;animation:fadeUp .25s ease}@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.ai-banner{display:flex;align-items:center;gap:14px;padding:10px 16px;background:linear-gradient(90deg,var(--amberG),rgba(52,152,219,.04));border:1px solid var(--amberD);border-radius:4px}.banner-icon{font-size:22px;color:var(--amber)}.banner-title{font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:600;color:var(--amber);letter-spacing:.5px}.banner-sub{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3);margin-top:1px}.banner-status{margin-left:auto;font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--amber);display:flex;align-items:center;gap:5px}.thinking-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);animation:pulse 1s infinite}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.faq-row{display:flex;gap:6px;flex-wrap:wrap}.faq-chip{background:var(--card);border:1px solid var(--bright);border-radius:20px;padding:5px 12px;cursor:pointer;font-size:10.5px;color:var(--t2);transition:all .15s;&:hover{border-color:var(--amber);color:var(--amber)}}.chat-card{padding:16px!important;display:flex;flex-direction:column;min-height:420px}.chat-messages{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-bottom:12px;min-height:0}.bubble{padding:10px 12px;border-radius:3px;&.user{background:var(--blueD);border-left:2px solid var(--blue)}&.assistant{background:var(--el);border-left:2px solid var(--amber)}}.sender{font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--t3);margin-bottom:4px;text-transform:uppercase}.msg-text{font-size:11px;color:var(--t2);line-height:1.6}.thinking{padding:10px;background:var(--el);border-left:2px solid var(--amber);border-radius:3px;font-size:10px;color:var(--t3);font-style:italic}.input-row{display:flex;gap:8px;margin-top:8px;align-items:flex-start}`]
})
export class AiAssistantComponent implements AfterViewChecked {
  @ViewChild('scrollRef') scrollRef!: ElementRef;
  private data = inject(DataService);
  private san = inject(DomSanitizer);
  readonly messages = signal<Message[]>([{role:'assistant',content:'I have full visibility of the Cordant Energy maintenance dataset. **500 assets** across 4 plants, 22 equipment sub-classes, 5,775 work orders, and 97 RCM-based strategies. What would you like to explore?'}]);
  readonly busy = signal(false);
  input = '';
  private history: {role:string;content:string}[] = [];

  readonly faqs = [
    'Which class has the most CM work orders?',
    'Top failure modes for motors?',
    'Which criticality-5 assets need maintenance?',
    'How to tailor vibration strategy for large motors?',
    'PM vs CM ratio for Plant 1?',
    'Which assets have the highest backlog risk?',
  ];

  askFaq(q: string) { this.input = q; this.send(); }

  async send() {
    if (!this.input.trim() || this.busy()) return;
    const q = this.input.trim(); this.input = '';
    this.messages.update(m => [...m, {role:'user',content:q}]);
    this.history.push({role:'user',content:q});
    this.busy.set(true);
    try {
      const url = window.location.hostname === 'localhost' ? 'http://localhost:3001/api/chat' : 'http://localhost:3001/api/chat';
      const res = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json'},
        body: JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,system:SYS,messages:this.history})});
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const reply = (data.content||[]).map((b:any)=>b.text||'').join('');
      this.history.push({role:'assistant',content:reply});
      this.messages.update(m => [...m, {role:'assistant',content:reply}]);
    } catch (e:any) {
      const msg = 'AI requires a local proxy server. Run: <code style="background:var(--el);padding:1px 4px;border-radius:2px">node server.js</code> then open localhost:3001';
      this.messages.update(m => [...m, {role:'assistant',content:msg,error:true}]);
      this.history.pop();
    }
    this.busy.set(false);
  }

  clear() {
    this.history = [];
    this.messages.set([{role:'assistant',content:'Session cleared. Full Cordant Energy data still loaded.'}]);
  }

  formatMsg(text: string): SafeHtml {
    const html = text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n\n/g,'</p><p style="margin-top:6px">').replace(/\n/g,'<br>');
    return this.san.bypassSecurityTrustHtml(html);
  }

  ngAfterViewChecked() {
    if (this.scrollRef?.nativeElement) {
      const el = this.scrollRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  exportChat() {
    const text = this.messages().map(m => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([text], {type:'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='Cordant_AI_Chat.txt'; a.click();
    URL.revokeObjectURL(url);
  }
}
