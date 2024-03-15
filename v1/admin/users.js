const { celebrate, Joi } = require('celebrate');
const { Router } = require('express');
const User = require('../../models/User.js');
const router = Router();

router.get(
  '/:userId',
  celebrate({
    params: Joi.object({
      userId: Joi.string().hex().length(24),
    }),
  }),
  async (req, res, next) => {
    const { userId } = req.params;
    const existingUser = await User.findOne({ _id: userId }).exec();
    if (!existingUser) return next(); // Fall back to 404 handler
    res.json({ success: true, user: existingUser.normalize() });
  }
);

router.get(
  '/',
  celebrate(
    {
      query: Joi.object({
        username: Joi.string().alphanum(),
        userId: Joi.string().hex().length(24),
      })
        .or('username', 'userId')
        .required(),
    },
    { stripUnknown: true }
  ),
  async (req, res, next) => {
    const { userId: _id, ...queryParams } = req.query;
    if (_id) queryParams._id = _id;
    const existingUser = await User.findOne(queryParams).exec();
    if (!existingUser) return next(); // Fall back to 404 handler
    res.json({ success: true, user: existingUser.normalize() });
  }
);

router.put(
  '/',
  celebrate({
    body: Joi.object({
      username: Joi.string().alphanum().lowercase().min(4).max(24).required(),
      password: Joi.string().min(8).max(1024).required(),
      roles: Joi.array().items(Joi.string().alphanum().required()).default(['user']),
    }),
  }),
  async (req, res) => {
    const { username, password, roles } = req.body;
    const existingUser = await User.findOne({ username }).exec();
    if (existingUser)
      return res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Username already taken' });

    const user = new User({ username, roles, active: true });
    const apiKey = await user.addAPIKey();
    await user.updatePassword(password);
    await user.save();
    res.json({ success: true, apiKey, user: user.normalize() });
  }
);

router.patch(
  '/:userId',
  celebrate(
    {
      params: Joi.object({
        userId: Joi.string().hex().length(24).required(),
      }),
      body: Joi.object({
        active: Joi.boolean(),
        password: Joi.string().min(8).max(1024),
        roles: Joi.array().items(Joi.string().alphanum()),
        username: Joi.string().alphanum().lowercase().min(4).max(24),
      }),
    },
    { stripUnknown: true }
  ),
  async (req, res, next) => {
    const { userId } = req.params;
    const { password, ...changes } = req.body;
    const user = await User.findById(userId).exec();
    if (!user) return next(); // Fall back to 404 handler
    Object.assign(user, changes);
    if (password) await user.updatePassword(password);
    await user.save();
    res.json({ success: true, user: user.normalize() });
  }
);

router.delete(
  '/:userId',
  celebrate({
    params: Joi.object({
      userId: Joi.string().hex().length(24).required(),
    }),
  }),
  async (req, res, next) => {
    const { userId } = req.params;
    const oldUser = await User.findByIdAndDelete(userId).exec();
    if (!oldUser) return next(); // Fall back to 404 handler
    res.json({ success: true });
  }
);

module.exports = router;
