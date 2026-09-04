import type { Locale } from '../locales';
import { common } from './common';
import { customerFlow } from './customerFlow';
import { authPages } from './authPages';
import { dashboardCore } from './dashboardCore';
import { menuTables } from './menuTables';
import { ordersWaiters } from './ordersWaiters';
import { analytics } from './analytics';
import { staffPortal } from './staffPortal';
import { staffMisc } from './staffMisc';
import { adminSupport } from './adminSupport';
import { billing } from './billing';
import { marketing } from './marketing';
import { floorPlan } from './floorPlan';
import { reservations } from './reservations';
import { cashDrawer } from './cashDrawer';
import { errorPages } from './errorPages';
import { legal } from './legal';
import { allergens } from './allergens';
import { orderHistory } from './orderHistory';
import { dietaryTags } from './dietaryTags';

const NAMESPACES: Record<Locale, Record<string, string>>[] = [
  common,
  customerFlow,
  authPages,
  dashboardCore,
  menuTables,
  ordersWaiters,
  analytics,
  staffPortal,
  staffMisc,
  adminSupport,
  billing,
  marketing,
  floorPlan,
  reservations,
  cashDrawer,
  errorPages,
  legal,
  allergens,
  orderHistory,
  dietaryTags,
];

const cache = new Map<Locale, Record<string, string>>();

export function buildDictionary(locale: Locale): Record<string, string> {
  const cached = cache.get(locale);
  if (cached) return cached;

  const merged: Record<string, string> = {};
  for (const namespace of NAMESPACES) {
    Object.assign(merged, namespace[locale]);
  }

  cache.set(locale, merged);
  return merged;
}
