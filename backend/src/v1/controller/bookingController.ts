import express from 'express';
import Joi, { func } from 'joi';
import { functions } from '../library/functions';
import { bookingModel } from '../model/bookingModel';
import { bookingDetailsModel } from '../model/bookingdetailsModel';
import { validations } from '../library/validations';
import { auth } from '../library/auth';

const router = express.Router();
const functionObj = new functions();
const bookingObj = new bookingModel();
const bookingdetailObj = new bookingDetailsModel();
const validationObj = new validations();
const authObj = new auth();

router.post('/create', createBookingSchema, authObj.authenticateUser, createBookingController);
router.get('/bookings', authObj.authenticateUser, allBookings);
router.get('/summary/:id', authObj.authenticateUser, bookingFullSummaryById)

router.get('/:id', bookingByIdSchema, authObj.isAdmin,bookingById);
router.put('/update', updateBookingSchema, bookingupdate);
router.put('/delete', deleteBookingSchema, deleteBooking);

export default router;

function sanitizeInput(req: any) {
  Object.keys(req.body).forEach((key) => {
    if (typeof req.body[key] === "string") {
      req.body[key] = req.body[key].trim().replace(/'/g, "");
    }
  });
}

function createBookingSchema(req: any, res: any, next: any) {
  sanitizeInput(req);

  const schema = Joi.object({
    from_city: Joi.string().min(2).max(20),
    to_city: Joi.string().min(2).max(20),
    seat_numbers: Joi.array()
      .items(Joi.string().alphanum().min(1).max(5))
      .min(1),
    passengers: Joi.array()
      .items(Joi.object({ name: Joi.string().min(2).max(100).required() }))
      .min(1),
    total_price: Joi.number().min(0).optional(),
  });

  if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function createBookingController(req: any, res: any) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.send(functionObj.output(401, "Unauthorized: User ID missing from token", null));
    }

    const {
      booking_schedule_id,
      schedule_total_price,
      selected_seats,
      passengers
    } = req.body;

    if (!booking_schedule_id || isNaN(Number(booking_schedule_id))) {
      return res.send(functionObj.output(400, "Invalid or missing booking_schedule_id", null));
    }

    if (!Array.isArray(selected_seats) || selected_seats.length === 0) {
      return res.send(functionObj.output(400, "Invalid or missing selected_seats", null));
    }

    if (!Array.isArray(passengers) || passengers.length !== selected_seats.length) {
      return res.send(functionObj.output(400, "Invalid or mismatched passengers", null));
    }

    const user_ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress;

    const result = await bookingObj.createBooking(
      user_id,
      Number(booking_schedule_id),
      schedule_total_price,
      selected_seats,
      passengers,
      user_ip
    );

    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Error in createBookingController", error));
  }
}

async function allBookings(req: any, res: any) {
  try {
    const result = await bookingObj.getAllBookings();

    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Internal error", error));
  }
}

function bookingByIdSchema(req: any, res: any, next: any) {
  sanitizeInput(req);

  const schema = Joi.object({
    id: Joi.number().integer().positive().required(),
  });

  if (!validationObj.validateRequest({ body: req.params }, res, next, schema)) return;
  next();
}

async function bookingById(req: any, res: any) {
  try {
    const BookingId = await parseInt(req.params.id);
    if (isNaN(BookingId) || BookingId < 1) {
      return res.send(functionObj.output(400, "Enter valid ID ", null));
    }
    const result = await bookingObj.getBookingById(BookingId);

    if (!result) {
      return res.send(functionObj.output(404, "Booking not found", null));
    }

    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Internal Error", error));
  }
}

function updateBookingSchema(req: any, res: any, next: any) {
  sanitizeInput(req);

  const schema = Joi.object({
    booking_id: Joi.number().required(),
    seat_numbers: Joi.array().items(Joi.string()).min(1).required(),
    passengers: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
        })
      )
      .min(1)
      .required(),
    status: Joi.string().valid("confirmed", "cancelled", "pending")
  });
  // if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function bookingupdate(req: any, res: any) {
  try {
    const { booking_id, user_id, seat_numbers, passengers, status } = req.body;

    const user_ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress;

    const result = await bookingObj.updateBooking(booking_id, user_id, seat_numbers, passengers, status, user_ip);

    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Internal error in updating", error));
  }
}

function deleteBookingSchema(req: any, res: any, next: any) {
  sanitizeInput(req);

  const schema = Joi.object({
    booking_id: Joi.number().integer().positive().required(),
    user_name: Joi.string().trim().required(),
  });

  // if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function deleteBooking(req: any, res: any) {
  try{
    const user_ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress;

    const { booking_id, user_id } = req.body;
    if (!booking_id || !user_id) {
      return res.send(functionObj.output(400, "booking_id and user_name are required", null));
    }
    const result = await bookingObj.cancleBooking(booking_id, user_id, user_ip);

    return res.send(result);
  }catch(error){
    return res.send(functionObj.output(500, "Internal Error in DeleteBooking", error));
  }
}

async function bookingFullSummaryById(req: any, res: any) {
  try {
    const bookingId = parseInt(req.params.id);
    if (isNaN(bookingId) || bookingId < 1) {
      return res.send(functionObj.output(400, "Enter valid ID", null));
    }

    const booking = await bookingObj.getBookingById(bookingId);  
    const passengers = await bookingdetailObj.getBookingDetailsById(bookingId); 

    if (!booking || !passengers) {
      return res.send(functionObj.output(404, "Booking not found", null));
    }

    const combined = {
      ...booking,
      passengers
    };

    return res.send(functionObj.output(200, "Booking summary fetched", combined));
  } catch (error) {
    return res.send(functionObj.output(500, "Internal Error", error));
  }
}









