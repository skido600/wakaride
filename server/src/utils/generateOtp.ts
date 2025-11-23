import crypto from "crypto";

function Otpcode(): string {
  const verificationCode = crypto.randomInt(100000, 999999).toString();
  return verificationCode;
}

function hmacProcess(code: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

export { hmacProcess, Otpcode };
