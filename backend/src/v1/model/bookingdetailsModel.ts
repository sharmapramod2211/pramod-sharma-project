import { appdb } from "./appdb";
import { functions } from '../library/functions';

const functionObj = new functions();

interface ServiceResponse {
    error: boolean;
    message: string;
    data: any;
}

export class bookingDetailsModel extends appdb {
    constructor(){
        super();
        this.table = 'booking_details';
        this.uniqueField = "id";
    }

    async getAllBookingDetails(): Promise<ServiceResponse> {
        try{
            const result = await this.listRecords("*");
            if(!result) {
                return functionObj.output(404, "BookingDetails not found", null);
            }

            return functionObj.output(200, "BookingDetails fetching detail", result);
        }catch(error){
            return functionObj.output(500, "Error , Feching Booking Details", error);
        }
    }

    async getBookingDetailsById(id: number): Promise<ServiceResponse> {
        try{
            const result = await this.selectRecord(id);
            if(!result) {
                return functionObj.output(404, "BookingDetails not found", null);
            }

            return functionObj.output(200, "BookingDetails...", result);
        }catch(error) {
            return functionObj.output(500, "Error , Feching Booking Details", error);
        }
    }

    async getBookingDetailsByUserId(id: number): Promise<ServiceResponse> {
        try{
            const userData = await this.select("users", "id", `WHERE id = '${id}'`, "", "");
            if(!userData){
                return functionObj.output(404, "User not found", null);
            }
            
            const bookingData = await this.select("bookings", "*", `WHERE booking_user_id = '${id}'`, "" , "");
            if(!bookingData) {
                return functionObj.output(404, "Booking not found", null);
            }

            const bookingids = bookingData.map((b: any) => b.id);

            const query = `
                SELECT bd.*, s.seat_number
                FROM booking_details bd 
                JOIN seats s ON bd.bookingdetails_seat_id = s.id
                WHERE bd.bookingdetails_booking_id IN (${bookingids.join(",")})
            `;
            const bookingDetails = await this.executeQuery(query) || [];

           const result = bookingData.map((booking: any) => {
            const passengers = bookingDetails.filter((bd:any) =>  bd.bookingdetails_booking_id ===  booking.id)
            return {
                ...booking,
                passengers,
            }
           }) 
           return functionObj.output(200, "Booking details fetched successfully", result);
        }catch(error) {
            console.log('====================================');
            console.log("error", error);
            console.log('====================================');
            return functionObj.output(500, "Error Get in Booking Details", error);
        }
    }
}
