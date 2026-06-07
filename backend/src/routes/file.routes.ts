import { Router } from 'express';
import * as fileController from '../controllers/file.controller.js';
import { auth } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.post('/', uploadSingle, handleUploadError, fileController.upload);
router.get('/', fileController.getAll);
router.get('/:id', fileController.getById);
router.delete('/:id', fileController.remove);

export default router;
