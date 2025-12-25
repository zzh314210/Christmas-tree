
export interface Photo {
  id: string;
  url: string;
}

export type GestureType = 'OPEN' | 'CLOSE' | 'NONE';

export interface HandData {
  gesture: GestureType;
  x: number;
  y: number;
}
