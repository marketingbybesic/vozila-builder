/**
 * Provjera hrvatskog OIB-a (Karlo st. 13): 11 znamenki + kontrolna znamenka
 * po ISO 7064, MOD 11,10. Bez ovoga bi u računovodstvo (Stripe R1) ulazili
 * tipfeleri koje nitko ne bi uhvatio do izdavanja računa.
 */
export function isValidOib(oib: string): boolean {
  if (!/^\d{11}$/.test(oib)) return false;
  let rem = 10;
  for (let i = 0; i < 10; i++) {
    rem = (rem + Number(oib[i])) % 10;
    if (rem === 0) rem = 10;
    rem = (rem * 2) % 11;
  }
  return (11 - rem) % 10 === Number(oib[10]);
}
