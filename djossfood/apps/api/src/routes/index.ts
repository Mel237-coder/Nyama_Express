import { Router } from 'express';
import { authRouter } from './auth';
import { searchRouter } from './search';
import { restaurantsRouter } from './restaurants';
import { ordersRouter } from './orders';
import { driversRouter } from './drivers';
import { paymentsRouter } from './payments';
import { ratingsRouter } from './ratings';
import { adminRouter } from './admin';
import { restaurantOwnerRouter } from './restaurantOwner';

const router = Router();

// Public routes
router.use('/auth', authRouter);
router.use('/search', searchRouter);
router.use('/restaurants', restaurantsRouter);
router.use('/payments', paymentsRouter);

// Protected routes (auth middleware applied inside each router)
router.use('/orders', ordersRouter);
router.use('/drivers', driversRouter);
router.use('/ratings', ratingsRouter);

// Admin routes (auth + role guard applied inside the router)
router.use('/admin', adminRouter);

// Restaurant owner routes (auth + role guard applied inside the router)
router.use('/restaurant-owner', restaurantOwnerRouter);

export const apiRouter = router;