/**
 * The old site computed `currentYear - 1985`, which read a year high between
 * 1 January and the birthday. This compares the full date.
 */
export const calculateAge = (birthDate: Date, today: Date = new Date()): number => {
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
};
