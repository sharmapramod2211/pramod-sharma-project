import express from 'express';
import userController from './controller/userController';
import companyController from './controller/companiesController';
import airplaneController from './controller/airplanesController';
import flightScheduleController from './controller/flightScheduleController';
import bookingController from './controller/bookingController';
import bookingDetailController from './controller/bookingdetailsController';
import paymentcontroller from './controller/paymentController';
import cityController from './controller/cityController';

const router = express.Router();

router.use('/user', userController);
router.use('/company', companyController);
router.use('/airplane', airplaneController);
router.use('/flight-schedule', flightScheduleController);
router.use('/booking', bookingController);
router.use('/details', bookingDetailController);
router.use('/payment', paymentcontroller);
router.use('/city', cityController);

export default router;