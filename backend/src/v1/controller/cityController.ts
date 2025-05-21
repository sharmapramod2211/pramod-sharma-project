import express from 'express';
import Joi, { func } from 'joi';
import { functions } from '../library/functions';
import { cityModel } from '../model/cityModel';
import { validations } from '../library/validations';
import { auth } from '../library/auth';

const router = express.Router();
const cityObj = new cityModel();
const functionObj = new functions();
const validationObj = new validations();
const authObj = new auth();

router.post('/city/add', addCitySchema, authObj.isAdmin, addCity);
router.get('/city/:name', getCityByNameSchema, authObj.isAdmin, getCityByName);
router.get('/citys', authObj.isAdmin, getAllCities);
router.get('/:id', getCityById);

export default router;


function sanitizeInput(req: any) {
    if (typeof req.body !== 'object') {
      return;
    }
    Object.keys(req.body).forEach((key) => {
      const value = req.body[key];
      if (typeof value === "string") {
        req.body[key] = value.trim().replace(/'/g, "");
      } 
    });
}
  
function addCitySchema(req: any, res: any, next: any) {
    sanitizeInput(req);
  
    const schema = Joi.object({
      city_name: Joi.string().trim().required(),
      city_state: Joi.string().trim().required(),
      city_country: Joi.string().trim().required(),
    });
  
    if (!validationObj.validateRequest(req, res, next, schema)) return;
    next();
}
  
async function addCity(req: any, res: any) {
    try {
        const { city_name, city_state, city_country, created_ip } = req.body;
        const result = await cityObj.addCity(city_name, city_state, city_country, created_ip);
        if (result.error) {
            return res.send(functionObj.output(401, "City not added", null));
        }

        return res.send(result);
    } catch (error) {
        console.log(error);
        return res.send(functionObj.output(500, "Error while adding city", error));
    }
}

function getCityByNameSchema(req: any, res: any, next: any) {
    sanitizeInput(req);
  
    const schema = Joi.object({
      name: Joi.string().trim().required(),
    });
  
    if (!validationObj.validateRequest({ body: req.params }, res, next, schema)) return;
    next();
}


async function getCityByName(req: any, res: any) {
    try {
        const cityName = req.params.name;
        const result = await cityObj.getCityByName(cityName);

        return res.send(result);
    } catch (error) {
        console.log(error);
        return res.send(functionObj.output(500, "Error while fetching city", error));
    }
}

async function getCityById(req: any, res: any) {
    try {
        const city_id = parseInt(req.params.id);
        if (isNaN(city_id)) {
            return res.send(functionObj.output(400, "Invalid city ID", null));
        }

        const result = await cityObj.getCityById(city_id);
        return res.send(result);
    } catch (error) {
        console.log(error);
        return res.send(functionObj.output(500, "Error while fetching city", error));
    }
}
async function getAllCities(req: any, res: any) {
    try {
        const result = await cityObj.getAllCities();
        return res.send(result);
    } catch (error) {
        console.log(error);
        return res.send(functionObj.output(500, "Error while fetching cities", error));
    }
}

