import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { ApiService, Bus, PickupPoint } from '../core/api.service';

@Component({
  standalone: true,
  imports: [IonContent],
  template: `
    <ion-content>
      <main class="page">
        <div class="headline"><div><h1 class="title">Track Bus</h1><p class="muted">Static OpenStreetMap view with bus locations</p></div></div>
        <div #mapContainer class="map-box full" [class.tile-error]="tileError">
          @if (tileError) { <div class="map-warning">Map tiles need internet. Bus and pickup markers still load.</div> }
        </div>
        <h2 class="section-title">Buses</h2>
        <section class="card list-card">
          @for (bus of buses; track bus.id) {
            <div class="row"><div class="icon-pill">{{ bus.color[0] }}</div><div class="row-main"><h3>{{ bus.plate_number }}</h3><p>{{ bus.color }} bus - capacity {{ bus.capacity }}</p></div></div>
          }
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .headline{display:flex;justify-content:space-between;gap:12px}
    .full{height:420px;margin-top:22px;position:relative;background:#edf1f7}
    .tile-error{background-image:linear-gradient(#cfd5df 1px,transparent 1px),linear-gradient(90deg,#cfd5df 1px,transparent 1px);background-size:48px 48px}
    .map-warning{position:absolute;left:14px;right:14px;bottom:14px;z-index:500;background:#fff;border:1px solid #e2e7f0;border-radius:14px;padding:10px 12px;color:#8b98ad;font-weight:800;font-size:13px}
  `]
})
export class TrackMapPage implements AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapEl!: ElementRef<HTMLElement>;
  buses: Bus[] = [];
  points: PickupPoint[] = [];
  tileError = false;
  private map?: any;
  private busMarkers = new Map<string, any>();

  constructor(private api: ApiService) {}

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 80);
  }

  ionViewDidEnter() {
    setTimeout(() => this.map?.invalidateSize(), 80);
  }

  private initMap() {
    if (this.map) return;
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: false }).setView([3.866, 11.513], 13);
    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap',
      maxZoom: 19
    });
    tiles.on('tileerror', () => this.tileError = true);
    tiles.addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 250);
    this.api.bootstrap().subscribe(data => {
      this.buses = data.buses;
      this.points = data.pickupPoints;
      this.points.forEach(point => L.circleMarker([Number(point.latitude), Number(point.longitude)], { radius: 8, color: '#215be6' }).bindTooltip(point.name).addTo(this.map!));
      this.buses.forEach(bus => this.upsertBus(bus));
    });
    this.api.realtime().on('bus:gps', (bus: Bus) => this.upsertBus(bus));
  }

  private upsertBus(bus: Bus) {
    if (!bus.last_lat || !bus.last_lng || !this.map) return;
    const pos = [Number(bus.last_lat), Number(bus.last_lng)] as [number, number];
    const marker = this.busMarkers.get(bus.id) || L.circleMarker(pos, {
      radius: 10,
      color: '#df7c00',
      fillColor: '#df7c00',
      fillOpacity: 0.9
    }).bindTooltip(bus.plate_number).addTo(this.map);
    marker.setLatLng(pos);
    this.busMarkers.set(bus.id, marker);
  }
}
