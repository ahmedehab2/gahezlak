import { Router } from 'express';
import {
  createMenuItemAndAddToCategoryController,
  getMenuItemByIdController,
  deleteMenuItemController,
  toggleItemAvailabilityController
} from '../controllers/menu-item-controller';

const router = Router();

router.post('/:shopId', createMenuItemAndAddToCategoryController);
router.get('/:shopId/:itemId', getMenuItemByIdController);
router.delete('/:shopId/:itemId', deleteMenuItemController);
router.patch('/:shopId/:itemId/toggle', toggleItemAvailabilityController);

export default router;