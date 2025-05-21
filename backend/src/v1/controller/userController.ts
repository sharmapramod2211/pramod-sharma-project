import express from "express";
import Joi from "joi";
import { functions } from "../library/functions";
import { userModel } from "../model/userModel";
import { validations } from "../library/validations";
import { auth } from "../library/auth";

const router = express.Router();
const userObj = new userModel();
const functionObj = new functions();
const validationObj = new validations();
const authObj = new auth();

router.post("/register", registerSchema, registerUser);
router.post("/verify-otp", verifyOtpSchema,verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", loginSchema, loginUser);
router.post("/forgot-password",forgotPasswordSchema,forgotPassword);
router.post("/reset-password",resetPasswordSchema,resetPassword);
router.get("/profile/:id", authObj.authenticateUser, getProfile);
router.put("/update",authObj.authenticateUser,authObj.isAdmin,updateUserSchema,updateUserProfile);
router.get("/alluser", authObj.isAdmin, allUser);

export default router;

function sanitizeInput(req: any) {
  Object.keys(req.body).forEach((key) => {
    if (typeof req.body[key] === "string") {
      req.body[key] = req.body[key].trim().replace(/'/g, "");
    }
  });
}

function registerSchema(req: any, res: any, next: any) {
  sanitizeInput(req);

  const schema = Joi.object({
    user_name: Joi.string().min(2).max(50).required(),
    user_email: Joi.string().email().required(),
    user_password: Joi.string()
      .min(6)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
      .required(),
    user_phone: Joi.string()
      .length(10)
      .pattern(/^[0-9]+$/)
      .required(),
    user_profile: Joi.string().uri().optional(),
  });

  if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function registerUser(req: any, res: any) {
  try {
    const user_ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress;

    const result = await userObj.registerUserService(req.body, user_ip);

    if (result.error) {
      return res.send(functionObj.output(0, result.message, null));
    }
    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Register User Error", error));
  }
}

function forgotPasswordSchema(req: any, res: any, next: any) {
  sanitizeInput(req);
  const schema = Joi.object({
    user_email: Joi.string().email().required(),
  });

  if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function forgotPassword(req: any, res: any) {
  try {
    const { user_email, ip } = req.body;

    const result = await userObj.forgotPassword(user_email, ip);

    if (result.error) {
      return res.send(functionObj.output(0, result.message, null));
    }

    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Register User Error", error));
  }
}

function resetPasswordSchema(req: any, res: any, next: any) {
  sanitizeInput(req);

  const schema = Joi.object({
    user_email: Joi.string().email().required(),
    user_otp_verify: Joi.number().required(),
    new_password: Joi.string()
      .trim()
      .required()
      .min(6)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
  });

  if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function resetPassword(req: any, res: any) {
  try {
    const { user_email, user_otp_verify, new_password } = req.body;

    const result = await userObj.resetPasswordService(
      user_email,
      parseInt(user_otp_verify),
      new_password
    );

    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Reset Password Error", error));
  }
}

function verifyOtpSchema(req: any, res: any, next: any) {
  sanitizeInput(req);
  const schema = Joi.object({
    user_email: Joi.string().email().required(),
    // user_otp_verify: Joi.string().required().min(100000).max(999999),
  });

  if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function verifyOtp(req: any, res: any) {
  try {
    const { user_email, user_otp_verify } = req.body;

    if (!user_email || !user_otp_verify) {
      return res.send(
        functionObj.output(0, "Email and OTP are required", null)
      );
    }

    const result = await userObj.verifyOtpService(
      user_email,
      parseInt(user_otp_verify)
    );
    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Verify OTP Error", error));
  }
}

async function resendOtp(req: any, res: any) {
  try {
      const { user_email } = req.body;
      const ip = req.ip;

      const result = await userObj.resendOtp(user_email, ip);
      return res.send(result);
  } catch (err) {
      return res.send(functionObj.output(500, "Internal Error", err));
  }
}

function loginSchema(req: any, res: any, next: any) {
  sanitizeInput(req);
  const schema = Joi.object({
    user_email: Joi.string().trim().required().email(),
    user_password: Joi.string().trim().required(),
  });
  if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function loginUser(req: any, res: any) {
  try {
    const { user_email, user_password } = req.body;
    const result = await userObj.loginService(user_email, user_password);
    if (!result){
      console.log(result);
      return res.send(functionObj.output(0, "Invalid Credentials", null));
    }
    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Login Error", error));
  }
}

async function getProfile(req: any, res: any) {
  try {
    const id: number = req.user.id;
    const result = await userObj.getProfileService(id);
    if (result.error) return res.send(functionObj.output(0, result.message));
    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Get Profile Error", error));
  }
}

function updateUserSchema(req: any, res: any, next: any) {
  sanitizeInput(req);
  const schema = Joi.object({
    user_name: Joi.string().trim().min(2).max(50),
    user_email: Joi.string().trim().email(),
    user_password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
    .required(),
    user_phone: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required(),
  });
  const { error } = schema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ success: false, message: error.details[0].message });
  next();
}

async function updateUserProfile(req: any, res: any) {
  try {
    const id = req.user.id;
    const userData = req.body;
    
    const user_ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress;
    
      const result = await userObj.updateUser(id, userData, user_ip);
    if (result.error) return res.send(functionObj.output(0, result.message));
    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Update User Error", error));
  }
}

async function allUser(req: any, res: any) {
  try {
    const result = await userObj.getAllUser();
    if (!result)
      return res.send(functionObj.output(0, "Result not found", null));
    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Get All Users Error", error));
  }
}
