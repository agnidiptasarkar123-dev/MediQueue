/**
 * Normalizes an Indian mobile number to the E.164 format: +91XXXXXXXXXX
 */
export function normalizeIndianPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.length === 13 && cleaned.startsWith("091")) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.length !== 10) {
    throw new Error("Invalid Indian mobile number. Please enter a 10-digit number.");
  }

  const dummyNumbers = ["0000000000", "1111111111", "2222222222", "3333333333", "4444444444", "5555555555", "6666666666", "7777777777", "8888888888", "9999999999", "1234567890", "0987654321", "9876543210"];
  if (dummyNumbers.includes(cleaned)) {
    throw new Error("Invalid phone number. Please enter a real mobile number.");
  }

  return `+91${cleaned}`;

  throw new Error("Invalid Indian mobile number. Please enter a 10-digit number.");
}

/**
 * Masks a phone number for display: +91 ******3210
 */
export function maskPhone(phone: string): string {
  const normalized = normalizeIndianPhone(phone);
  return `+91 ******${normalized.slice(-4)}`;
}
