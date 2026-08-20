/**
 * Generates a numeric OTP of the given length (default 6).
 * @param numberOfDigits - length of the OTP
 * @returns the generated OTP as a string
 */
export function generateOtp(numberOfDigits = 6): string {
  const min = Math.pow(10, numberOfDigits - 1);
  const max = Math.pow(10, numberOfDigits) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}
