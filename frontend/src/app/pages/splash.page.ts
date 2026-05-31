import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationOutline, logInOutline, qrCodeOutline, shieldCheckmarkOutline } from 'ionicons/icons';

@Component({
  standalone: true,
  imports: [IonButton, IonContent, IonIcon],
  template: `
    <ion-content fullscreen>
      <main class="splash">
        <section class="brand-block">
          <img class="crest" src="assets/st jean logo.png" alt="Saint Jean Ingenieur logo">
          <div>
            <p class="institute">Saint Jean</p>
            <p class="muted">Ingenieur</p>
            <p ><strong> <span>Eyang Transport Management System</span> </strong> </p>
          </div>
        </section>

       

        <section class="actions">
          <ion-button class="login-button" (click)="login()"><ion-icon name="log-in-outline" />Login</ion-button>
        </section>

        <section class="features">
          <span><ion-icon name="shield-checkmark-outline" />Secure Access</span>
          <span><ion-icon name="location-outline" />Live Tracking</span>
          <span><ion-icon name="qr-code-outline" />QR Boarding</span>
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .splash{position:relative;min-height:100%;padding:54px 24px 28px;display:grid;grid-template-rows:auto 1fr auto auto;gap:22px;overflow:hidden;color:#fff;justify-items:end;text-align:right}
    .splash::before{content:"";position:absolute;inset:0;background:linear-gradient(-90deg,rgba(4,22,54,.85) 0%,rgba(4,22,54,.6) 40%,rgba(4,22,54,.15) 100%),url('/assets/Eyang_splash.png') center/cover no-repeat}
    .splash::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 58%,rgba(0,0,0,.5) 100%)}
    .splash>*{position:relative;z-index:1;opacity:0.85}
    .brand-block{display:flex;align-items:center;gap:14px;flex-direction:row-reverse}
    .crest{width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,.28))}
    .institute{margin:0;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:.5px}
    .brand-block .muted{margin:2px 0 0;color:rgba(255,255,255,.82);font-weight:800;text-transform:uppercase;letter-spacing:4px}
    .copy{align-self:center;max-width:360px;text-shadow:0 10px 30px rgba(0,0,0,.35)}
    .copy h1{margin:0;font-size:48px;line-height:1.06;font-weight:950}
    .copy h1 span,.copy h1 strong{display:block}
    .copy h1 strong{color:#f6c712}
    .copy p{margin:22px 0 0;font-size:24px;font-weight:800}
    .actions{display:grid;grid-template-columns:1fr;gap:14px;max-width:260px}
    .actions ion-button{height:58px;margin:0;font-size:16px;font-weight:900;--border-radius:22px;text-transform:none}
    .login-button{--background:#fff;--color:#0b3168}
    .actions ion-icon{font-size:23px;margin-right:8px}
    .features{display:grid;grid-template-columns:1fr;gap:10px;margin-top:8px}
    .features span{display:flex;align-items:center;gap:10px;font-weight:850;color:rgba(255,255,255,.92);flex-direction:row-reverse}
    .features ion-icon{width:34px;height:34px;border-radius:17px;background:#215be6;padding:8px}
    @media (min-width: 520px){.splash{padding:70px 64px 44px}.copy h1{font-size:62px}.features{grid-template-columns:repeat(3,max-content);justify-content:end}}
    @media (max-height: 700px){.splash{padding-top:34px}.crest{width:58px;height:58px}.copy h1{font-size:40px}.copy p{font-size:20px;margin-top:14px}.features{display:none}}
  `]
})
export class SplashPage {
  constructor(private router: Router) {
    addIcons({ logInOutline, shieldCheckmarkOutline, locationOutline, qrCodeOutline });
  }

  login() {
    return this.router.navigateByUrl('/login');
  }
}
