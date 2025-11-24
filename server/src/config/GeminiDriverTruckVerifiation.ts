import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export interface VerificationResult {
  result: {
    name: string;
    header: string;
    valid: boolean;
    issues: any;
  };
}

export async function verifyDriverApplication(
  driverData: {
    licenseNumber: string;
    phone: string;
    truckType: string;
    country: string;
    state: string;
    town: string;
    price: number;
    discountPrice: number;
    experience: string;
    description: string;
  },
  base64Image: string
): Promise<VerificationResult> {
  const messages: any = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `
You are an AI verification system. Review this driver application.

Check for:
- fake or AI generated truck photos
- mismatched truck type
- low-quality or irrelevant images
- Do not reject valid country-specific plate numbers. Only flag numbers that are obviously fake, inconsistent with the country, or contain impossible characters.
- wrong phone number format
- suspicious or uninformative descriptions
- Do NOT flag the price or discount as unrealistic. Accept the driver’s input as valid.
- invalid location
- missing or suspicious information

Return a STRICT JSON response:

result:{
  "header": message of the result
  "valid": true/false,
  "issues": ["list all problems here"]
  }


Driver details:
License: ${driverData.licenseNumber}
Phone: ${driverData.phone}
Truck Type: ${driverData.truckType}
Country: ${driverData.country}
State: ${driverData.state}
Town: ${driverData.town}
Price: ${driverData.price}
Discount: ${driverData.discountPrice}
Experience: ${driverData.experience}
Description: ${driverData.description}
          `,
        },
        {
          type: "image",
          image: base64Image,
        },
      ],
    },
  ];

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    messages,
  });

  const cleanedText = text
    .replace(/^```json\s*/, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleanedText) as VerificationResult;
}
