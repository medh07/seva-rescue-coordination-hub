export interface RequestRow {
  id: string; tracking_code: string; details: string; created_at: string;
  status: string; verification: string; operational_priority: string | null;
  reported_severity: string; life_threatening: boolean; people_affected: number;
  latitude: number | null; longitude: number | null; landmark: string | null;
}
export const REQUEST_FIELDS = 'id,tracking_code,details,created_at,status,verification,operational_priority,reported_severity,life_threatening,people_affected,latitude,longitude,landmark';
export function canUseCommandCentre(roles: { role: string; active: boolean }[]) {
  return roles.some(r => r.active && (r.role === 'admin' || r.role === 'officer'));
}
export const label = (value: string) => value.replaceAll('_', ' ');
