export type signupType = {
  full_name: string;
  email: string;
  userName: string;
  password: string;
  confirmPassword: string;
  role: "client" | "driver" | "admin";
};

export type LoginType = {
  Email_Username: string;
  password: string;
};

export type resetOtp = {
  resetToken: string;
  newPassword: string;
  confirmNewpassword: string;
};
