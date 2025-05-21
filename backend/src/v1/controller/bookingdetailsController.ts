import express from 'express';
import Joi, { func } from 'joi';
import { functions } from '../library/functions';
import { bookingDetailsModel } from '../model/bookingdetailsModel';
import { validations } from '../library/validations';
import { auth } from '../library/auth';

const router = express.Router();
const functionObj = new functions();
const bookingdetailObj = new bookingDetailsModel();
const validationObj = new validations();
const authObj = new auth();

router.get('/details/:id', getBookingDetailsByBookingId);
router.get('/details', authObj.authenticateUser, authObj.isAdmin, allBookings);
router.get('/bookings/:id',  bookingByUserId);

export default router;

function sanitizeInput(req: any) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim().replace(/'/g, "");
      }
    });
}

function bookingByIdSchema(req: any, res: any, next: any) {
    sanitizeInput(req);
  
    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
    });
  
    if (!validationObj.validateRequest({ body: req.params }, res, next, schema)) return;
    next();
}
  
async function getBookingDetailsByBookingId(req:any, res:any) {
    try{
        const bookingId = await parseInt(req.params.id);
        if (isNaN(bookingId) || bookingId < 1) {
            return res.send(functionObj.output(400, "Enter valid ID ", null));
        }
        const result = await bookingdetailObj.getBookingDetailsById(bookingId);
        if(!result) {
            return res.send(functionObj.output(404, "BookingDetail not found", null));
        }
        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Internal Error in Geting booking", error));
    }
}

async function allBookings(req: any, res:any) {
    try{
        const result = await bookingdetailObj.getAllBookingDetails();
        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Internal Error in Geting booking", error));
    }
}

function bookingByUserIdSchema(req: any, res: any, next: any) {
    sanitizeInput(req);
  
    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
    });
  
    if (!validationObj.validateRequest({ body: req.params }, res, next, schema)) return;
    next();
}
  
async function bookingByUserId(req: any, res: any) {
    try{
        const userId = await parseInt(req.params.id);
        if (isNaN(userId) || userId < 1) {
            return res.send(functionObj.output(400, "Enter valid ID ", null));
        }
        const result = await bookingdetailObj.getBookingDetailsByUserId(userId);
        if(!result) {
            return res.send(functionObj.output(404, "BookingDetails not found", null));
        }

        return  res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Internal error in BookingDetails", error));
    }
}

