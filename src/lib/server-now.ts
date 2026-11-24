/** Request clock captured outside a React render expression. */
export function readServerNow(): number {
  return Date.now();
}
