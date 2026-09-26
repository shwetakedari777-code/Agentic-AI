const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const result = await authService.register({ name, email, password, role });
      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.status(200).json({
        success: true,
        message: 'Authenticated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
