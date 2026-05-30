
import{Router}from"express";import{activityController}from"./activity.controller";import{authenticate}from"../../middlewares";
const router=Router();router.use(authenticate);
router.get("/",activityController.getMy);router.get("/form/:formId",activityController.getByForm);
router.get("/alerts/unread",activityController.getUnread);router.patch("/alerts/:id/read",activityController.markRead);
export default router;
