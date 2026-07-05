import Joi from "joi";

export const createRoleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  description: Joi.string().trim().max(255).allow("", null),
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  description: Joi.string().trim().max(255).allow("", null),
});

export const createPermissionSchema = Joi.object({
  name: Joi.string().trim().pattern(/^[a-z]+:[a-z]+$/).required().messages({
    "string.pattern.base": "Permission name must follow 'resource:action' format, e.g. 'users:edit'",
  }),
  description: Joi.string().trim().max(255).allow("", null),
});

export const assignRoleToUserSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  roleId: Joi.number().integer().positive().required(),
});

export const assignPermissionToRoleSchema = Joi.object({
  roleId: Joi.number().integer().positive().required(),
  permissionId: Joi.number().integer().positive().required(),
});