import express from 'express';
import Joi, { func } from 'joi';
import { functions } from '../library/functions';
import { airplanesModel } from '../model/airplaneModel';
import { validations } from '../library/validations';
import { auth } from '../library/auth';

const router = express.Router();
const airplaneObj = new airplanesModel();
const functionObj = new functions();
const validationObj = new validations();
const authObj = new auth();

router.post('/add', createAirplaneSchema, authObj.isAdmin,addAirplane);
router.get('/', airplaneByIdSchema, authObj.isAdmin,allAirplanes);
router.get('/:id', authObj.isAdmin,airplaneById);
router.get('/company/:id', airplaneByCompanyIdSchema, authObj.isAdmin,airplaneByCompanyId);
router.get('/company/company-name', airplaneByCompanyNameSchema, authObj.isAdmin,airplaneByCompanyName);
router.put('/:id', updateAirplanesSchema, authObj.isAdmin,updateAirplanes);
router.delete('/:id', deleteAirplaneSchema, authObj.isAdmin,deleteAirplane);

export default router;

function sanitizeInput(req: any) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim().replace(/'/g, "");
      }
    });
}

function createAirplaneSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
      airplane_name: Joi.string().trim().required(),
      airplane_total_seats: Joi.number().integer().min(1).required(),
      airplane_company_id: Joi.number().integer().required()
    });
    next();
}

async function addAirplane(req: any, res: any) {
    try { 
        const user_ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress;
        
        const { airplane_name, airplane_total_seats, airplane_company_id } = req.body;
        const result = await airplaneObj.createAirplane(airplane_name, airplane_total_seats, airplane_company_id, user_ip);
    
        return res.send(result);
    } catch (error) {
        return res.send(functionObj.output(500, "Error in Adding Airplane", error));
    }
}

async function allAirplanes(req: any, res: any) {
    try{
        const result = await airplaneObj.getAllAirplane();

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Error Fetching Airplane", error));
    }
}

function airplaneByIdSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
    });
    next();
}
  
async function airplaneById(req: any, res: any) {
    try{
        const airplaneById = parseInt(req.params.id);
        if (isNaN(airplaneById) || airplaneById < 1) {
            return res.send(functionObj.output(400, "Enter valid ID ", null));
        }
        const result =  await airplaneObj.getAirplaneById(airplaneById);

        if(!result){
            return res.send(functionObj.output(404, "Data not found", null));
        }

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Error Fetching Airplane", error));
    }
}

function updateAirplanesSchema(req: any, res: any, next: any) {
    sanitizeInput(req);
  
    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
      airplane_name: Joi.string().trim().required(),
      airplane_total_seats: Joi.number().integer().min(1).required(),
    });
    if (!validationObj.validateRequest(req, res, next, schema)) return;
    next();
}
  
async function updateAirplanes(req: any, res: any) {
    try{
        const id = parseInt(req.params.id);
        if (isNaN(id) || id < 1) {
            return res.send(functionObj.output(400, "Enter valid ID ", null));
        }
        const { airplane_name, airplane_total_seats} = req.body;

        const updated_ip = req.header['x-forwareded-for']?.toString().split(',')[0] || req.socket.remoteAddress;

        const result = await airplaneObj.updateAirplane(id, {airplane_name, airplane_total_seats}, updated_ip);

        if(!result){
            return res.send(functionObj.output(404, "Airplane not found", null));
        }

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Error in update airplane", error));
    }
}

function deleteAirplaneSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
    });
    next();
}
  
async function deleteAirplane(req: any, res: any) {
    try{
        const id = parseInt(req.params.id);
        const result = await airplaneObj.deleteAirplane(id);

        if(!result){
            return res.send(functionObj.output(404, "Airplane not found", null));
        }

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Error in deleting airplane", error));
    }
}

function airplaneByCompanyIdSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
    });
    if (!validationObj.validateRequest(req, res, next, schema)) return;
    next();
}
  
async function airplaneByCompanyId(req: any, res: any) {
    try{
        const id = parseInt(req.params.id);
        if (isNaN(id) || id < 1) {
            return res.send(functionObj.output(400, "Enter valid ID ", null));
        }
        const result = await airplaneObj.getAirplaneByCompanyId(id);
        
        if(!result) {
            return res.send(functionObj.output(404, "Airplane not found", null));
        }

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Error in deleting airplane", error));
    }
}

function airplaneByCompanyNameSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
      company_name: Joi.string().trim().required(),
    });
    if (!validationObj.validateRequest(req, res, next, schema)) return;
    next();
}
  
async function airplaneByCompanyName(req: any, res: any) {
    try{
        const {company_name} = req.body;
    
        if (!company_name) {
            return res.send(functionObj.output(400, "Company name is required", null));
        }
    
        const result = await airplaneObj.getAirplaneByCompanyName(company_name);

        if (!result || result.data.length === 0) {
            return res.send(functionObj.output(404, "Airplanes not found", null));
        }

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Error in Airplanes", error));
    }
}


