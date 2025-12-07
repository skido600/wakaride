import Auth from "../models/userSchema.ts";
import { queue as emailworker } from "../utils/emailworker.ts";
import { hmacProcess, Otpcode } from "../utils/generateOtp.ts";
import TokenGenerate from "../utils/GenerateToken.ts";
import { client } from "../utils/redis.ts";
import argon2 from "argon2";
const VERIFY_EXPIRES_IN = 30 * 60 * 1000;

//register
export const registerUser = async (
  full_name: string,
  email: string,
  userName: string,
  password: string,
  confirmPassword: string,
  role: string
) => {
  try {
    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }
    const normalizedFullName = full_name.toLowerCase();
    const normalizedUserName = userName.toLowerCase();
    const hashedPassword = await argon2.hash(password);

    const newUser = new Auth({
      full_name: normalizedFullName,
      email,
      userName: normalizedUserName,
      password: hashedPassword,
      isVerified: false,
      verificationCodeExpires: new Date(Date.now() + VERIFY_EXPIRES_IN),
      role,
    });
    await newUser.save();

    const token = TokenGenerate.generateMailToken(
      newUser._id,
      newUser.full_name
    );
    console.log(token);
    const verifyLink = `${process.env.FRONTURL}/verify?token=${token}`;
    await emailworker.add(
      "send-email",
      {
        type: "verification",
        user: newUser,
        verificationLink: verifyLink,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: true,
      }
    );

    return newUser;
  } catch (error) {
    throw error;
  }
};

//emailotp_verification
export const verifyEmailService = async (token: string) => {
  try {
    if (!token) {
      throw new Error("Verification token is required");
    }
    const decodetoken = TokenGenerate.decodedjwt(token);

    const user = await Auth.findById(decodetoken.userId);

    if (!user) {
      throw new Error("User not found");
    }

    if (
      !user.verificationCodeExpires ||
      new Date() > user.verificationCodeExpires
    ) {
      throw new Error(
        "Verification link has expired. Please request a new one before logging in."
      );
    }
    if (user.isVerified) {
      throw new Error("user already verified");
    }
    user.isVerified = true;
    user.verificationCodeExpires = null;
    await user.save();
    return "Email verified successfully!";
  } catch (error) {
    throw error;
  }
};

//login_service
export const LoginService = async (
  Email_Username: string,
  password: string
) => {
  try {
    const normalizedInput = Email_Username.toLowerCase();
    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    }).select("+password");

    if (!user) {
      throw new Error("User not found");
    }
    const validPassword = await argon2.verify(user.password, password);
    if (!validPassword) {
      throw new Error("Incorrect password");
    }
    if (!user.isVerified) {
      const expired =
        !user.verificationCodeExpires ||
        user.verificationCodeExpires < new Date();

      if (expired) {
        const token = TokenGenerate.generateMailToken(user._id, user.full_name);
        console.log("verify token", token);
        const verifyLink = `${process.env.FRONTURL}/verify?token=${token}`;
        // await STMPservice.Sendingverification(user, verifyLink);
        await emailworker.add(
          "send-email",
          {
            type: "Retryverification",
            user: user,
            verificationLink: verifyLink,
          },
          {
            attempts: 3,
            backoff: { type: "exponential", delay: 3000 },
            removeOnComplete: true,
            removeOnFail: true,
          }
        );

        user.verificationCodeExpires = new Date(Date.now() + VERIFY_EXPIRES_IN);
        await user.save();
        throw new Error(
          "Verification link expired. A new link has been sent to your email."
        );
      } else {
        throw new Error("Email not verified. Please check your inbox.");
      }
    }

    const accesstoken = TokenGenerate.generateAccessToken(user);
    const refreshtoken = TokenGenerate.generateRefreshToken(user);

    await client.set(
      `refresh:${user._id}`,
      refreshtoken,
      "EX",
      60 * 60 * 24 * 7
    );

    return { user, accesstoken, refreshtoken };
  } catch (error) {
    throw error;
  }
};
//forgetpassword
export async function forgotPasswordService(email: string) {
  try {
    const normalizedInput = email.toLowerCase();
    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    });
    if (!user) throw new Error("User not found invalid email or username");
    const verificationCode = Otpcode();
    const hashedCode = hmacProcess(
      verificationCode,
      process.env.HMAC_VERIFICATION_CODE_SECRET as string
    );
    //5mins
    const expiryTime = 5 * 60;
    //store otp in redis
    await client.set(`otp:${user._id}`, hashedCode, "EX", expiryTime);

    //sendemail
    await emailworker.add(
      "send-email",
      {
        type: "otp",
        user: user,
        verificationLink: verificationCode,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
    // await STMPservice.SendingOtp(user, verificationCode);

    return {
      email,
      message:
        "Password reset code sent to your email. the code will expire in the next 20mins",
    };
  } catch (error) {
    throw error;
  }
}

//verifycode_otp
export async function verifyCodeService(
  email: string,
  code: string
): Promise<any> {
  try {
    const normalizedInput = email.toLowerCase();

    const user = await Auth.findOne({
      $or: [{ email: normalizedInput }, { userName: normalizedInput }],
    });

    if (!user) {
      throw new Error("User not found");
    }

    const hashedInputOtp = hmacProcess(
      code,
      process.env.HMAC_VERIFICATION_CODE_SECRET as string
    );
    //get otp on redis and verify
    const storedOtp = await client.get(`otp:${user._id}`);

    if (!storedOtp) {
      throw new Error("OTP expired or not found");
    }
    if (storedOtp !== hashedInputOtp) {
      throw new Error("Invalid OTP");
    }

    const tokenassign = TokenGenerate.forgetpasswordToken(user);

    return { tokenassign };
  } catch (error) {
    throw error;
  }
}

//reset_otp
export async function resetPasswordService(
  resetToken: string,
  newPassword: string,
  confirmNewpassword: string
) {
  try {
    if (newPassword !== confirmNewpassword) {
      throw new Error("Passwords do not match");
    }
    const decode = TokenGenerate.forgetpasswordTokenVerification(resetToken);

    const user = await Auth.findById(decode.id);

    if (!user) {
      throw new Error("User not found");
    }

    const storedOtp = await client.get(`otp:${user._id}`);
    console.log(storedOtp, "redis store otp");
    if (!storedOtp) {
      throw new Error("OTP expired or not found");
    }

    const hashedPassword = await argon2.hash(newPassword);
    user.password = hashedPassword;
    await user.save();
    //delete the user otp in redis
    await client.del(`otp:${user._id}`);
  } catch (error) {
    throw error;
  }
}
