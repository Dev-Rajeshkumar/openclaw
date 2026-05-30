
import{Router}from"express";import{authController}from"./auth.controller";import{authenticate}from"../../middlewares";
const router=Router();router.post("/signup",authController.signup);router.post("/login",authController.login);
router.get("/me",authenticate,authController.me);router.post("/regenerate-key",authenticate,authController.regenerateApiKey);
export default router;
