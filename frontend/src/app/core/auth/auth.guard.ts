import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const u = auth.user;
  if (!u) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const roleGuard =
  (...allowed: Role[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const u = auth.user;
    if (!u) {
      router.navigate(['/login']);
      return false;
    }
    if (!allowed.includes(u.role)) {
      router.navigate([`/app/${u.role}/home`]);
      return false;
    }
    return true;
  };

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const u = auth.user;
  if (u) {
    router.navigate([`/app/${u.role}/home`]);
    return false;
  }
  return true;
};
