
import{Router}from"express";import{webhookController}from"./webhook.controller";import{authenticate}from"../../middlewares";
const router=Router({mergeParams:true});router.use(authenticate);
router.post("/",webhookController.create);router.get("/",webhookController.getByForm);router.delete("/:id",webhookController.delete);
export default router;
