import Joi from "joi";

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});