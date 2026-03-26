import { Router } from 'express';
import Joi from 'joi';
import validate from '../middlewares/validate.js';
import auth from '../middlewares/auth.js';
import {
  uploadImages, getImages, deleteImage, reorderImages, upload,
} from '../controllers/image.controller.js';

const router = Router();

const reorderSchema = Joi.object({
  imageIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

router.use(auth);

router.post('/', upload.array('images', 10), uploadImages);
router.get('/', getImages);
router.delete('/:id', deleteImage);
router.put('/reorder', validate(reorderSchema), reorderImages);

export default router;
