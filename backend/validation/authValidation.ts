const Joi = require("joi");
export const registerSchema = Joi.object({
  name: Joi.string()
  .min(3)
  .required()
  .messages({
    "string.min": "Name must be at least 3 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string()
  .email()
  .required()
  .messages({
    "string.email": "Please enter a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string()
  .min(8)
  .pattern(
    new RegExp(
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$'
    )
  )
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters",
    "string.pattern.base":
      "Password must contain uppercase, lowercase, number and special character",
    "any.required": "Password is required",
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
module.exports = {
  registerSchema,
  loginSchema,
};