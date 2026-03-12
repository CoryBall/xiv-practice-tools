export const SCALE = 1200

export function s(v: number) {
  return v * SCALE
}

/** Scale a pixel value designed for a 600px canvas to the current SCALE */
export function px(v: number) {
  return v * SCALE / 600
}
