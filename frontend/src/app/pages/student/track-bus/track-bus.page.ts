import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { ApiService } from '../../../core/api/api.service';
import { StorageService } from '../../../core/storage/storage.service';

interface Bus { id: string; plate_number: string; color: string; status: string; last_latitude: string | null; last_longitude: string | null; driver_name: string | null; }
interface PickupPoint { id: number; code: string; name: string; latitude: string; longitude: string; is_destination: boolean }

const BUSES_CACHE = 'ests.cache.buses';
const PICKUP_CACHE = 'ests.cache.pickup_points';

@Component({
  selector: 'app-track-bus',
  standalone: false,
  templateUrl: './track-bus.page.html',
  styleUrls: ['./track-bus.page.scss'],
})
export class TrackBusPage implements AfterViewInit, OnDestroy {
  @ViewChild('mapHost', { static: false }) mapHost!: ElementRef<HTMLDivElement>;
  private map?: L.Map;
  private busLayer?: L.LayerGroup;
  private pickupLayer?: L.LayerGroup;
  buses: Bus[] = [];
  pickups: PickupPoint[] = [];
  private pollTimer?: ReturnType<typeof setInterval>;

  constructor(private api: ApiService, private storage: StorageService) {}

  async ngAfterViewInit() {
    this.initMap();
    await this.loadFromCache();
    await this.refresh();
    this.pollTimer = setInterval(() => this.refresh(), 15_000);
  }

  ngOnDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.map?.remove();
  }

  private initMap() {
    if (!this.mapHost) return;
    this.map = L.map(this.mapHost.nativeElement, { zoomControl: true })
      .setView([3.866, 11.523], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    this.busLayer = L.layerGroup().addTo(this.map);
    this.pickupLayer = L.layerGroup().addTo(this.map);
  }

  private async loadFromCache() {
    const cb = await this.storage.get<Bus[]>(BUSES_CACHE);
    if (cb) this.buses = cb;
    const cp = await this.storage.get<PickupPoint[]>(PICKUP_CACHE);
    if (cp) this.pickups = cp;
    this.renderMarkers();
  }

  async refresh() {
    try {
      const [b, p] = await Promise.all([
        this.api.get<{ buses: Bus[] }>('/buses'),
        this.api.get<{ pickup_points: PickupPoint[] }>('/pickup-points'),
      ]);
      this.buses = b.buses;
      this.pickups = p.pickup_points;
      await this.storage.set(BUSES_CACHE, this.buses);
      await this.storage.set(PICKUP_CACHE, this.pickups);
      this.renderMarkers();
    } catch {/* offline */}
  }

  private renderMarkers() {
    if (!this.map || !this.busLayer || !this.pickupLayer) return;
    this.busLayer.clearLayers();
    this.pickupLayer.clearLayers();

    for (const pt of this.pickups) {
      const lat = Number(pt.latitude);
      const lng = Number(pt.longitude);
      const color = pt.is_destination ? '#10B981' : '#64748B';
      const icon = L.divIcon({
        className: 'pickup-marker',
        html: `<div class="pickup-pin" style="background:${color}"><ion-icon style="color:#fff;font-size:14px;">📍</ion-icon></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([lat, lng], { icon }).addTo(this.pickupLayer).bindPopup(`<b>${pt.name}</b>`);
    }

    for (const b of this.buses) {
      if (!b.last_latitude || !b.last_longitude) continue;
      const lat = Number(b.last_latitude);
      const lng = Number(b.last_longitude);
      const tone = b.status === 'on_route' ? '#F59E0B' : '#94A3B8';
      const icon = L.divIcon({
        className: 'bus-marker',
        html: `<div class="bus-pin" style="background:${tone}">${b.plate_number.replace(/\s+/g, '')}</div>`,
        iconSize: [80, 28],
        iconAnchor: [40, 14],
      });
      L.marker([lat, lng], { icon })
        .addTo(this.busLayer)
        .bindPopup(`<b>${b.plate_number}</b><br>${b.driver_name ?? ''}<br>${b.status}`);
    }
  }
}
