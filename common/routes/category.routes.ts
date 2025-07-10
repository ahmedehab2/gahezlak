import { Router } from 'express';
import {
  createCategoryController,
  deleteCategoryController,
  getCategoriesByShopController,
  updateCategoryController
} from '../controllers/category.controller';

const router = Router();

router.post('/:shopId', createCategoryController);
router.get('/:shopId', getCategoriesByShopController);
router.put('/:shopId/:categoryId', updateCategoryController);
router.delete('/:shopId/:categoryId', deleteCategoryController);

export default router;
