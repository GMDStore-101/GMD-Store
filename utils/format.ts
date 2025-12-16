
export const formatPhoneNumber = (value: string) => {
  // Removes non-digits
  const digits = value.replace(/\D/g, '');
  // Matches 03XX-XXXXXXX
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
};

export const formatCNIC = (value: string) => {
  // Removes non-digits
  const digits = value.replace(/\D/g, '');
  // Matches XXXXX-XXXXXXX-X
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
};
