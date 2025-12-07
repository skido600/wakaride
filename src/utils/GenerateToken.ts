import jwt from "jsonwebtoken";
class TokenGenerate {
  //secrect envs
  private static ACCESS_TOKEN_SECRET: string = process.env
    .ACCESS_TOKEN_SECRET as string;
  private static REFRESH_TOKEN_SECRET: string = process.env
    .REFRESH_TOKEN_SECRET as string;
  private static JWT_Secret: string = process.env.JWT_SEC as string;
  //AccessTokentoken
  public static generateAccessToken(user: any) {
    const payload = {
      _id: user._id,
      email: user.email,
      isVerified: user.isVerified,
      isAdmin: user.isAdmin,
      full_name: user.full_name,
      role: user.role,
    };
    const token = jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    return token;
  }
  //refreshTokentoken
  public static generateRefreshToken(user: any) {
    const payload = { _id: user._id };

    const refreshToken = jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    return refreshToken;
  }
  //emailverifcation decode
  public static decodedjwt(token: string): any {
    return jwt.verify(token, this.JWT_Secret);
  }
  //emailverifcation assign
  public static generateMailToken(userId: any, full_name: string) {
    return jwt.sign({ userId, full_name }, this.JWT_Secret, {
      expiresIn: "1h",
    });
  }
  //forgetpasswordToken
  public static forgetpasswordToken(user: any): any {
    return jwt.sign({ id: user._id }, this.JWT_Secret!, {
      expiresIn: "10m",
    });
  }
  public static forgetpasswordTokenVerification(resetToken: any): any {
    return jwt.verify(resetToken, this.JWT_Secret!);
  }
}
export default TokenGenerate;
