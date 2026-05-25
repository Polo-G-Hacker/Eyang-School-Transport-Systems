import { query } from "../db/pool";

export interface PickupPoint {
  id: number;
  code: string;
  name: string;
  latitude: string;
  longitude: string;
  is_destination: boolean;
  sort_order: number;
}

export async function listAll(): Promise<PickupPoint[]> {
  const { rows } = await query<PickupPoint>(
    `SELECT * FROM pickup_points ORDER BY sort_order`,
  );
  return rows;
}
