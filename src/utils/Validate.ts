import Joi from "joi";

//signup validation
export const CreateUserSchema = Joi.object({
  full_name: Joi.string().min(4).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 4 characters",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Invalid email address",
    "any.required": "Email is required",
  }),
  userName: Joi.string().min(4).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 4 characters",
  }),
  role: Joi.string().required().messages({
    "string.empty": "role is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
});

//login validation
export const Loginuser = Joi.object({
  Email_Username: Joi.string().min(4).required().messages({
    "string.empty": "Email or username is required",
    "string.min": "Must be at least 2 characters",
  }),

  password: Joi.string().min(5).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 5 characters",
  }),
});

//email otp sending
export const Firstemailvalidate = Joi.object({
  email: Joi.string().min(4).required().messages({
    "string.empty": "Email or username is required",
    "string.min": "Must be at least 2 characters",
  }),
});

//verify code route
export const Verifycode = Joi.object({
  //   resetToken: Joi.string().required().messages({
  //     "string.empty": "resetToken is required",
  //   }),
  email: Joi.string().min(4).required().messages({
    "string.empty": "Email or username is required",
    "string.min": "Must be at least 2 characters",
  }),
  code: Joi.string().required().messages({ "string.empty": "code Required" }),
});

//confirem otp
export const ResetPassword = Joi.object({
  resetToken: Joi.string().required().messages({
    "string.empty": "resetToken is required",
  }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({ "string.empty": "newPassword is Required" }),
  confirmNewpassword: Joi.string()
    .required()
    .messages({ "string.empty": " confirmNewpassword is Required" }),
});

//drivereditusernameandfullname
export const DriverEdit = Joi.object({
  userName: Joi.string().min(4).required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 4 characters",
  }),
  full_name: Joi.string().min(4).required().messages({
    "string.empty": "Full name is required",
    "string.min": "Full name must be at least 4 characters",
  }),
});

//changepassword
export const changepassword = Joi.object({
  oldpassword: Joi.string().min(6).required().messages({
    "string.min": "oldpassword must be at least 6 characters",
    "any.required": "oldpassword is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

export const Driverdetails = Joi.object({
  licenseNumber: Joi.string().alphanum().required().min(8).max(16).messages({
    "string.empty": "License number is required.",
    "string.alphanum": "License number must contain only letters and numbers.",
    "string.min":
      "Hey user, we don’t think this license is valid — driver licenses are usually more than 8 characters.",
    "string.max": "License number seems too long — please check again.",
  }),

  phone: Joi.number()
    .integer()
    .min(1000000000)
    .max(999999999999999)
    .required()
    .messages({
      "number.base": "Phone number must be a number",
      "number.min": "Phone number must have at least 10 digits",
      "number.max": "Phone number must not exceed 15 digits",
      "any.required": "Phone number is required",
    }),

  truckType: Joi.string().required().messages({
    "string.empty": "Please enter the truck type you want to register.",
  }),

  country: Joi.string().required().messages({
    "string.empty": "Country is required.",
  }),
  state: Joi.string().required().messages({
    "string.empty": "State is required.",
  }),

  town: Joi.string().required().messages({
    "string.empty": "Town is required.",
  }),
  price: Joi.number().required().messages({
    "number.base": "Price must be a number.",
    "any.required": "Price is required.",
  }),
  discountPrice: Joi.number().required().messages({
    "number.base": "Price must be a number.",
    "any.required": "Price is required.",
  }),
  experience: Joi.number().required().messages({
    "any.required": "Experience is required.",
    "number.base": "Experience must be a number (in years).",
  }),

  description: Joi.string().required().messages({
    "string.empty": "Description is required.",
  }),
});
