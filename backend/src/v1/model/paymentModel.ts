import { appdb } from "./appdb";
import { functions } from '../library/functions';

const functionObj = new functions();

interface ServiceResponse {
    error: boolean;
    message: string;
    data: any;
}

export class paymentModel extends appdb {
    constructor(){
        super();
        this.table = "payments";
        this.uniqueField = "id";
    }

    async createPayment(booking_id: number, method: string, _amount: number, ip: string): Promise<ServiceResponse> {
        try{
            const bookingData = await this.select("bookings", "*", `WHERE id = '${booking_id}'`, "", "LIMIT 1");
            
            if(!bookingData) {
            // console.log('====================================');
            // console.log("booking_id", bookingData);
            // console.log('====================================');
            return functionObj.output(404, "Booking not found", null);
            }
            const bookingid = bookingData[0].id;

            const bookingAmount = await this.select("bookings", "booking_total_price", `WHERE id = ${booking_id}`, "", "LIMIT 1");
            if (!bookingAmount) {
                return functionObj.output(404, "Booking not found", null);
            }

            const amount = bookingAmount[0].booking_total_price;
            

            const paymentData = await this.insert("payments", {
                payment_booking_id: bookingid,
                payment_method: method,
                payment_amount: _amount,
                payment_status: "paid", 
                created_ip: ip,
            })

        
            await this.update("bookings", { booking_status: "confirmed", updated_ip: ip }, `WHERE id = '${booking_id}'`);

            return functionObj.output(200, "Payment successful", {
                payment_id: paymentData,
                amount,
                booking_id
              });
        }catch(error){
            return functionObj.output(500, "Error Making Payment", error);
        }
    }

    async cancelPayment(booking_id: number, ip: string): Promise<ServiceResponse> {
        try {
          const bookingData = await this.select("bookings", "*", `WHERE id = ${booking_id}`, "", "LIMIT 1");
          if (!bookingData || bookingData.length === 0) {
            return functionObj.output(404, "Booking not found", null);
          }
    
          const updatePayment = await this.update("payments",{payment_status: "cancelled",updated_ip: ip},`WHERE payment_booking_id = ${booking_id}`);
      
          await this.update("bookings",{booking_status: "cancelled",updated_ip: ip},`WHERE id = ${booking_id}`);
      
          const seatRecords = await this.select(
            "booking_details bd JOIN seats s ON bd.bookingdetails_seat_id = s.id",
            "s.id",
            `WHERE bd.bookingdetails_booking_id = ${booking_id}`,"",""
          );
      
          for (const seat of seatRecords) {
            await this.update("seats",{ seat_is_booked: false, updated_ip: ip },`WHERE id = ${seat.id}`);
          }
      
          return functionObj.output(200, "Payment cancelled and seats released", {
            booking_id,
            status: "cancelled"
          });
      
        } catch (error) {
          return functionObj.output(500, "Error cancelling payment", error);
        }
    }

    async getPaymentDetailById(id: number): Promise<ServiceResponse> {
        try{
            const result = await this.selectRecord(id);
            if(!result) {
                return functionObj.output(404, "Payment not found", null);
            }

            return functionObj.output(200, "Payment Details", result);
        }catch(error){
            return functionObj.output(500, "Error in Payment", error);
        }
    }

    async getAllPayment(): Promise<ServiceResponse> {
        try{
            const result = await this.allRecords("*");
            if(!result){
                return functionObj.output(404, "Payment not found", null);
            }

            return functionObj.output(200, "Payment Details", result);
        }catch(error){
            return functionObj.output(500, "Error in Payment", error);
        }
    }

    async getPaymentsByUserId(id: number): Promise<ServiceResponse> {
        try {
            const user = await this.select("users", "*", `WHERE id = ${id}`, "", "LIMIT 1");
            if (!user || user.length === 0) {
                return functionObj.output(404, "User not found", null);
            }
    
            const query = `
                SELECT 
                    payments.id AS payment_id,
                    payments.payment_method,
                    payments.payment_status,
                    payments.payment_amount,
                    payments.payment_time,
                    payments.payment_booking_id,
                    bookings.booking_status,
                    bookings.booking_total_price
                FROM payments
                JOIN bookings ON payments.payment_booking_id = bookings.id
                WHERE bookings.booking_user_id = ${id}
                ORDER BY payments.payment_time DESC;
            `;
    
            const result = await this.executeQuery(query);
            return functionObj.output(200, "Payments fetched successfully", result);
        } catch (error) {
            return functionObj.output(500, "Error fetching user payments", error);
        }
    }    
}