import path from "path";
import fs from "fs";
class STMPservice {
  private static VerificationTemplate = path.join(
    __dirname,
    "template",
    "emailverification.html"
  );
  private static otpTemplate = path.join(
    __dirname,
    "template",
    "otpemail.html"
  );
  private static EMAIL_API_URL =
    "https://emailsender-theta.vercel.app/send-email";
  public static async Sendingverification(
    user: { full_name: string; email: string },
    verifyUrl: string
  ) {
    let htmlContent = fs.readFileSync(this.VerificationTemplate, "utf-8");

    const currentYear = new Date().getFullYear();
    let companylogo = `${
      process.env.SERVER_URL || "localhost:5000"
    }/images/company.png `;
    htmlContent = htmlContent
      .replace("{{verification_link}}", verifyUrl)
      .replace("{{first_name}}", user.full_name)
      .replace("{{logo_url}}", companylogo)
      .replace("{{company_name}}", "wakaRide")
      .replace("{{year}}", currentYear.toString());
    await fetch(this.EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: user.email,
        subject: "WakaRide",
        html: htmlContent,
      }),
    });
  }
  public static async SendingOtp(
    user: { full_name: string; email: string },
    otpCode: string
  ) {
    let htmlContent = fs.readFileSync(this.otpTemplate, "utf-8");
    const currentYear = new Date().getFullYear();

    htmlContent = htmlContent
      .replace(/{{otp_code}}/g, otpCode)
      .replace(/{{first_name}}/g, user.full_name)
      .replace(/{{year}}/g, currentYear.toString())
      .replace(/{{company_name}}/g, "WakaRide");

    await fetch(this.EMAIL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: user.email,
        subject: "Your OTP Code - WakaRide",
        html: htmlContent,
      }),
    });

    // console.log("OTP email sent:", sendmail.status);
  }
}
export default STMPservice;
