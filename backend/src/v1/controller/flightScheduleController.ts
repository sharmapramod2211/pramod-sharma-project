import express from "express";
import Joi, { func } from "joi";
import { flightScheduleModel } from "../model/flightScheduleModel";
import { airplanesModel } from "../model/airplaneModel";
import { functions } from "../library/functions";
import { validations } from "../library/validations";
import { auth } from "../library/auth";

const router = express.Router();
const flightObj = new flightScheduleModel();
const airplaneObj = new airplanesModel();
const functionObj = new functions();
const validationObj = new validations();
const authObj = new auth();

router.post("/add",  createFlightSchema, authObj.isAdmin, createFlightSchedule);
router.get("/schedule/:id", flightScheduleByIdSchema, authObj.isAdmin, flightScheduleById);
router.put("/:id",  updateFlightSchema, authObj.isAdmin, updatedFlightSchedule);
router.delete("/:id", authObj.isAdmin, deleteflightSchedule);

router.post("/searchFlightSchedule", searchFlightSchema, searchFlight);
router.get("/seats/:id", listSeatsSchema, listseats);
router.get("/", allFlightSchedules);

export default router;

function sanitizeInput(req: any) {
  Object.keys(req.body).forEach((key) => {
    if (typeof req.body[key] === "string") {
      req.body[key] = req.body[key].trim().replace(/'/g, "");
    }
  });
}

function createFlightSchema(req: any, res: any, next: any) {
  sanitizeInput(req);

  const schema = Joi.object({
    schedule_airplane_id: Joi.number().min(1).required().messages({'number.min': 'Id must be atleast 1'}),
    schedule_from_city_id: Joi.number().min(1).required().messages({'number.min': 'Id must be atleast 1'}),
    schedule_to_city_id: Joi.number().min(1).required().messages({'number.min': 'Id must be atleast 1'}),
    schedule_departure_time: Joi.string().required(),
    schedule_arrival_time: Joi.string().required(),
    schedule_duration: Joi.string().required(),
    schedule_price_per_seat: Joi.number().required(),
    schedule_departure_platform: Joi.string().required(),
    schedule_arrival_platform: Joi.string().required(),
  });

  if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function createFlightSchedule(req: any, res: any) {
  try {
    const user_ip =
      req.headers["x-forweded-for"]?.toString().split(",")[0] ||
      req.socket.remoteAddress;

    const {
      schedule_airplane_id,
      schedule_from_city_id,
      schedule_to_city_id,
      schedule_departure_time,
      schedule_arrival_time,
      schedule_duration,
      schedule_price_per_seat,
      schedule_departure_platform,
      schedule_arrival_platform,
    } = req.body;

    const query = await airplaneObj.getAirplaneById(schedule_airplane_id);

    if (!query) {
      return functionObj.output(404, "Airplane not found", null);
    }

    const total_seats = query.data.airplane_total_seats;

    const citiCheck = await flightObj.select(
      "cities",
      "id",
      `WHERE id IN (${schedule_from_city_id}, ${schedule_to_city_id})`,
      "",
      ""
    );

    if (!citiCheck) {
      return functionObj.output(404, "Cities not found in controller", null);
    }

    const result = await flightObj.createflightSchedule(
      {
        schedule_airplane_id: Number(schedule_airplane_id),
        schedule_from_city_id: Number(schedule_from_city_id),
        schedule_to_city_id: Number(schedule_to_city_id),
        schedule_departure_time,
        schedule_arrival_time,
        schedule_duration,
        schedule_price_per_seat: Number(schedule_price_per_seat),
        schedule_departure_platform,
        schedule_arrival_platform,
      },
      user_ip
    );
    return res.send(result);
  } catch (error) {
    return res.send(
      functionObj.output(500, "Error in createFlightSchedule controller", error)
    );
  }
}

export function flightScheduleByIdSchema(req: any, res: any, next: any) {
  const schema = Joi.object({id: Joi.number().min(1).max(500).required()});
  if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();

}

async function flightScheduleById(req: any, res: any) {
  try {
    const flightById = parseInt(req.params.id);
    if (isNaN(flightById) || flightById < 1) {
      return res.send(functionObj.output(400, "Enter valid ID ", null));
    }
    
    const result = await flightObj.findScheduleByID(flightById);
    if (!result) {
      return res.send(functionObj.output(404, "Data not found", null));
    }

    return res.send(result);
  } catch (error) {
    return res.send(
      functionObj.output(500, "Error Fetching flightSchedule", error)
    );
  }
}

async function allFlightSchedules(req: any, res: any) {
  try {
    const result = await flightObj.getAllFlightSchedule();

    return res.send(result);
  } catch (error) {
    return res.send(
      functionObj.output(500, "Error Fetching flightSchedules", error)
    );
  }
}

function updateFlightSchema(req: any, res: any, next: any) {
  sanitizeInput(req);

  const schema = Joi.object({
    schedule_airplane_id: Joi.number().integer(),
    schedule_from_city_id: Joi.number().integer(),
    schedule_to_city_id: Joi.number().integer(),
    schedule_departure_time: Joi.string(),
    schedule_arrival_time: Joi.string(),
    schedule_duration: Joi.string(),
    schedule_price_per_seat: Joi.number(),
    schedule_departure_platform: Joi.string(),
    schedule_arrival_platform: Joi.string(),
  });

  if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function updatedFlightSchedule(req: any, res: any) {
  try {
    const user_ip = req.socket.remoteAddress;

    const id = parseInt(req.params.id);
    if (isNaN(id) || id < 1) {
      return res.send(functionObj.output(400, "Enter valid ID ", null));
    }

    const {
      schedule_airplane_id,
      schedule_from_city_id,
      schedule_to_city_id,
      schedule_departure_time,
      schedule_arrival_time,
      schedule_duration,
      schedule_price_per_seat,
      schedule_departure_platform,
      schedule_arrival_platform,
    } = req.body;

    const result = await flightObj.updateFlightSchedule(
      id,
      {
        schedule_airplane_id: Number(schedule_airplane_id),
        schedule_from_city_id: Number(schedule_from_city_id),
        schedule_to_city_id: Number(schedule_to_city_id),
        schedule_departure_time,
        schedule_arrival_time,
        schedule_duration,
        schedule_price_per_seat: Number(schedule_price_per_seat),
        schedule_departure_platform,
        schedule_arrival_platform,
      },
      user_ip
    );

    return res.send(result);
  } catch (error) {
    console.log('====================================');
    console.log("Error", error);
    console.log('====================================');
    return res.send(
      functionObj.output(500, "Error Updateing flightSchedules", error)
    );
  }
}

async function deleteflightSchedule(req: any, res: any) {
  try {
    const id = parseInt(req.params.id);
    const result = await flightObj.deleteFlightSchedule(id);

    if (!result) {
      return functionObj.output(404, "FlightSchedule not found", null);
    }

    return res.send(result);
  } catch (error) {
    return res.send(
      functionObj.output(500, "Error Updateing flightSchedules", error)
    );
  }
}

function searchFlightSchema(req: any, res: any, next: any) {
  sanitizeInput(req);

  const schema = Joi.object({
    schedule_from_city: Joi.string().trim().messages({
      "any.required": "From city is required",
      "string.base": "From city must be a string",
      "string.empty": "From city cannot be empty",
    }),
    schedule_to_city: Joi.string().trim().messages({
      "any.required": "To city is required",
      "string.base": "To city must be a string",
      "string.empty": "To city cannot be empty",
    }),
    // date: Joi.date().iso().optional().messages({
    //   "date.base": "Date must be a valid date",
    //   "date.format": "Date must be in ISO format (YYYY-MM-DD)",
    // }),
  });

  if (!validationObj.validateRequest(req, res, next, schema)) return;
  next();
}

async function searchFlight(req: any, res: any) {
  try {
    const { schedule_from_city, schedule_to_city, date } = req.body;

    if (!schedule_from_city || !schedule_to_city) {
      return res.send(functionObj.output(400, "Please provide both from and to city names", null));
    }

    const result = await flightObj.getFlightScheduleByCity(schedule_from_city, schedule_to_city, date);

    return res.send(result);
  } catch (error) {
    return res.send(functionObj.output(500, "Error in searching flight schedules", error));
  }
}

function listSeatsSchema(req: any, res: any, next: any) {
  const schema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
      "any.required": "Schedule ID is required",
      "number.base": "Schedule ID must be a number",
      "number.integer": "Schedule ID must be an integer",
      "number.positive": "Schedule ID must be a positive number",
    }),
  });
  next();
}

async function listseats(req: any, res: any) {
  try{
    const scheduleId = parseInt(req.params.id);
    const result = await flightObj.getseats(scheduleId);
    if(!result) {
      return res.send(functionObj.output(404, "Seats not found", null));
    }

    return res.send(result);
  }catch(error) {
    return res.send(functionObj.output(500, "Internal Error in ListSeats", error));
  }
}

