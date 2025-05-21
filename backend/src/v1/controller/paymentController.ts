import express from 'express';
import Joi, { func } from 'joi';
import { functions } from '../library/functions';
import { paymentModel } from '../model/paymentModel';
import { validations } from '../library/validations';
import { auth } from '../library/auth';

const router = express.Router();
const paymentObj = new paymentModel();
const functionObj = new functions();
const validationObj = new validations();
const authObj = new auth();

router.post('/add',  authObj.authenticateUser, addPayment);
router.get('/cancel',  cancelPaymentSchema, authObj.authenticateUser, cancelPayments);
router.get('/',  paymentByUserIdSchema, authObj.isAdmin, paymentByUserId);

router.get('/:id', authObj.authenticateUser, authObj.isAdmin, paymentById);
router.get('/payments', authObj.isAdmin, allPayments);


export default router;


function createPaymentSchema(req: any, res: any, next: any) { 
    const schema = Joi.object({
    booking_id: Joi.number().integer().required(),
    payment_method: Joi.string().valid("upi", "netbanking", "card", "wallet").required()
    });
    if (!validationObj.validateRequest(req, res, next, schema)) return;
    next();
}

async function addPayment(req: any, res: any) {
    try{
        const { booking_id, payment_method } = req.body;

        const ip =
            req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
            req.socket.remoteAddress;

        const result = await paymentObj.createPayment(booking_id, payment_method, 0, ip);

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Error in Payment", error));
    }
}

function cancelPaymentSchema(req:any, res: any, next: any) {
  const schema = Joi.object({
  booking_id: Joi.number().integer().positive().required()
});
if (!validationObj.validateRequest(req, res, next, schema)) return;
    next();
}

async function cancelPayments(req: any, res: any) {
    try{
        const {booking_id} = req.body;

        const user_ip =
            req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
            req.socket.remoteAddress;

        const result = await paymentObj.cancelPayment(booking_id, user_ip);

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Internal Error ib Payment", error));
    }
}

async function paymentById(req: any, res: any) {
    try{
        const paymentId = await parseInt(req.params.id);
        if (isNaN(paymentId) || paymentId < 1) {
            return res.send(functionObj.output(400, "Enter valid ID ", null));
        }
        const result = await paymentObj.getPaymentDetailById(paymentId);
        if(!result) {
            return res.send(functionObj.output(404, "Payment not found", null));
        }

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Error in Payment controller",error));
    }
}

async function allPayments(req: any, res: any) {
    try{
        const result = await paymentObj.getAllPayment();
        if(!result) {
            return res.send(functionObj.output(404, "Payment not found", null));
        }

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Error in payments", error));
    }
}

function paymentByUserIdSchema(req:any, res: any, next: any) {
    const schema = Joi.object({
    user_id: Joi.number().integer().positive().required().messages({
        "number.integer": "User ID must be an integer",
    })
    });
    if (!validationObj.validateRequest(req, res, next, schema)) return;
    next();
}

async function paymentByUserId(req: any, res: any) {
    try{
        const { user_id } = req.body;
        if (isNaN(user_id) || user_id < 1) {
            return res.send(functionObj.output(400, "Enter valid ID ", null));
        }
      
        const result = await paymentObj.getPaymentsByUserId(user_id);
        if(!result) {
            return res.send(functionObj.output(404, "Payment not found", null));
        }

        return res.send(result);
    }catch(error){
        return res.send(functionObj.output(500, "Internal Error in payment", error));
    }
}

