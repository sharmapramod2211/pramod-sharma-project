import express from 'express';
import Joi, { func } from 'joi';
import { functions } from '../library/functions';
import { companiesModel } from '../model/companiesModel';
import { validations } from '../library/validations';
import { auth } from '../library/auth';

const router = express.Router();
const companyObj = new companiesModel();
const functionObj = new functions();
const validationObj = new validations();
const authObj = new auth();

router.post('/add', addCompanySchema,authObj.isAdmin,addCompany);
router.get('/company/:id', getCompanyByIdSchema, authObj.isAdmin, companyById);
router.put('/:id', updateCompanySchema, authObj.isAdmin, updateCompany);

router.get('/all', allCompany);

export default router;

function sanitizeInput(req: any) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key].trim().replace(/'/g, "");
      }
    });
}

function addCompanySchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        company_name: Joi.string().trim().min(2).max(50).required(),
        company_logo: Joi.string().uri().optional()
    });

    if (!validationObj.validateRequest(req, res, next, schema)) return;
    next();
}

async function addCompany(req: any, res: any) {
    try{
        const { company_name, company_logo, created_ip } = req.body;
        const result = await companyObj.createCompanies(company_name, company_logo, created_ip);

        if(result.error){
            return res.send(functionObj.output(401, "Company not added", null));
        }

        return res.send( result);
    }catch(error){
        console.log(error);
        return res.send(functionObj.output(500, 'Error while adding company', error));
    }
}

function getCompanyByIdSchema(req: any, res: any, next: any) {
    const schema = Joi.object({
        id: Joi.number().integer().positive().required()
    });

    const validationResult = schema.validate(req.params);
    if (validationResult.error) {
        return res.send(functionObj.output(400, 'Invalid Company ID', validationResult.error.details));
    }
    next();
}

async function companyById(req: any, res: any){
    try{
        const company_id = parseInt(req.params.id);
        if (isNaN(company_id) || company_id < 1) {
            return res.send(functionObj.output(400, "Enter valid ID ", null));
        }
        const result  = await companyObj.getCompanieById(company_id);
    
        if(result.error){
            return functionObj.output(401, "Company not exsist", null);
        }
        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, 'Error while geting company', error));
    }
}

function updateCompanySchema(req: any, res: any, next: any) {
    sanitizeInput(req);
  
    const schema = Joi.object({
      id: Joi.number().integer().positive().required(),
      company_name: Joi.string().trim().required(),
      company_logo: Joi.string().uri().optional(),
    });
  
    const data = {
      id: parseInt(req.params.id),
      ...req.body,
    };
  
    if (!validationObj.validateRequest({ body: data }, res, next, schema)) return;
    next();
}
  
async function updateCompany(req: any, res: any) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id < 1) {
            return res.send(functionObj.output(400, "Enter valid ID ", null));
        }
        const { company_name, company_logo } = req.body;

        const user_ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket.remoteAddress;

        const result = await companyObj.updateCompany(id, {
            company_name,
            company_logo,
            updated_ip: user_ip
        });

        if (result.error) {
            return res.send(functionObj.output(0, result.message, null));
        }

        return res.send(result);
    } catch (error) {
        return res.send(functionObj.output(500, "Error in updating company", error));
    }
}

async function allCompany(req: any, res: any) {
    try{
        const result = await companyObj.getAllCompany();

        if(result.error){
            return res.send(functionObj.output(0, result.message, null));
        }
        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Error in fetching company", error));
    }
}
