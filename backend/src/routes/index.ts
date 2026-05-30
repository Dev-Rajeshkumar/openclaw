
import{Router}from"express";import{authRoutes}from"./auth";import{formRoutes}from"./form";import{submissionRoutes}from"./submission";import{aiRoutes}from"./ai";import{activityRoutes}from"./activity";
import webhookRoutes from"../modules/webhook/webhook.route";import integrationRoutes from"../modules/integration/integration.route";import paymentRoutes from"../modules/payment/payment.route";
const router=Router();
router.use("/api/v1/auth",authRoutes);router.use("/api/v1/forms",formRoutes);router.use("/api/v1/submissions",submissionRoutes);
router.use("/api/v1/ai",aiRoutes);router.use("/api/v1/activity",activityRoutes);
router.use("/api/v1/forms/:formId/webhooks",webhookRoutes);router.use("/api/v1/forms/:formId/integrations",integrationRoutes);router.use("/api/v1/forms/:formId/payments",paymentRoutes);
export default router;
