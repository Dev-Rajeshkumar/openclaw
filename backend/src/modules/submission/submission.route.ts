
import{Router}from"express";import{submissionController}from"./submission.controller";import{authenticate}from"../../middlewares";
const router=Router();router.post("/:slug",submissionController.submit);
router.use(authenticate);router.get("/form/:formId",submissionController.getByForm);router.get("/form/:formId/export",submissionController.export);
export default router;
