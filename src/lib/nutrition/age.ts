// Edad derivada de la fecha de nacimiento — no se guarda en la BD para que
// no quede desactualizada; se calcula cada vez que se necesita.
export function calculateAge(birthDate: Date, asOf: Date = new Date()): number {
  let age = asOf.getUTCFullYear() - birthDate.getUTCFullYear();
  const hadBirthdayThisYear =
    asOf.getUTCMonth() > birthDate.getUTCMonth() ||
    (asOf.getUTCMonth() === birthDate.getUTCMonth() && asOf.getUTCDate() >= birthDate.getUTCDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}
