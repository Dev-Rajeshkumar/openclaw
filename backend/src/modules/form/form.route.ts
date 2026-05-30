
import{Router}from"express";import{formController}from"./form.controller";import{authenticate}from"../../middlewares";
const router=Router();router.use(authenticate);
router.post("/",formController.create);router.get("/",formController.getAll);router.get("/:id",formController.getById);router.put("/:id",formController.update);router.delete("/:id",formController.delete);
export default router;
