import { appdb } from "./appdb";
import { functions } from '../library/functions';
import { flightScheduleModel } from "./flightScheduleModel";

const functionObj = new functions();
const flightObj = new flightScheduleModel();

interface ServiceResponse {
    error: boolean;
    message: string;
    data: any;
}

export class bookingModel extends appdb {
    constructor(){
        super();
        this.table = 'bookings';
        this.uniqueField = 'id';
    }

    async createBooking(user_id: number,schedule_id: number,booking_total_price:number = 0, seat_numbers: string[], passengers: any[], ip: string): Promise<ServiceResponse> {
      try{
        const user = await this.select("users", "id", `WHERE id  = '${user_id}'`, "", "LIMIT 1");
        if(user.error) {
          return functionObj.output(404, "User not found", null);
        }
        const userid = user[0].id;

        const schedule = await this.select("flight_schedules", "*", `WHERE id = ${schedule_id}`, "", "LIMIT 1");
        if (!schedule || schedule.length === 0) {
          return functionObj.output(404, "Schedule not found", null);
        }
        const scheduleData = schedule[0];
        const scheduleid = scheduleData.id;
        
        const seatQuery = `SELECT id, seat_number, seat_is_booked FROM seats WHERE seat_schedule_id = ${scheduleid} AND seat_number IN (${seat_numbers.map(s => `'${s}'`).join(",")})`;
        const seatData = await this.executeQuery(seatQuery);
        if (!seatData || seatData.length !== seat_numbers.length ) {
          const foundSeatNumbers = seatData.map((s: any) => s.seat_number);
          const missing = seat_numbers.filter(s => !foundSeatNumbers.includes(s));
          return functionObj.output(400, `Invalid or unavailable seat_numbers: ${missing.join(', ')}`, null);
        }

        const pricePerSeat: number = scheduleData.schedule_price_per_seat;
        const numberOfSeats = seatData.length;

        const baseTotalPrice = pricePerSeat * numberOfSeats;

        const gstRate = 0.18;
        const gstAmount = baseTotalPrice * gstRate;
        const totalPrice = baseTotalPrice + gstAmount;

        const bookingData = await this.insertRecord({
          booking_user_id: userid,
          booking_schedule_id: scheduleid,
          booking_status:  'confirmed',
          booking_total_price: totalPrice,
          booking_refund_status: false,
          created_ip: ip
        });

        for (let i = 0; i < passengers.length; i++) {
          const seat = seatData.find((s: { seat_number: string }) => s.seat_number === seat_numbers[i]);
          const passenger = passengers[i];

          await this.insert("booking_details", {
            bookingdetails_booking_id: bookingData,
            bookingdetails_user_id: userid,
            bookingdetails_passenger_name: passenger.name,
            bookingdetails_fare: Number (pricePerSeat),
            bookingdetails_seat_id: seat.id,
            created_ip: ip
          })

          for (const seat of seatData) {
             await this.update("seats", { seat_is_booked: true, updated_ip: ip }, `WHERE id = ${seat.id}`);
          }       
        }

        return functionObj.output(200, "Booking Created Successfully", {
          booking_id: bookingData,
          booking_seats: seat_numbers,
        })
      }catch(error){
        return functionObj.output(500, "Error in creating bookings", error);
      }
    }
    
    async getAllBookings(): Promise<ServiceResponse> {
      try{
        const result = await this.listRecords("*");

        if(!result) {
          return functionObj.output(404, "Booking not found", null);
        }

        return functionObj.output(200, "All Bookings", result);
      }catch(error){
        return functionObj.output(500, "Error while fetching bookings", error);
      }
    }

    async getBookingById(id: number): Promise<ServiceResponse> {
      try{
        const result = await this.selectRecord(id);

        if(!result) {
          return functionObj.output(404, "Booking not found", null);
        }

        return functionObj.output(200, "All Bookings", result);
      }catch(error){
        return functionObj.output(500, "Error in Booking", error);
      }
    }

    async updateBooking(booking_id: number, user_id: number, seat_numbers: string[], passengers: any[], status: string, ip: string): Promise<ServiceResponse> {
      try{
        const user = await this.select("users", "id", `WHERE id  = '${user_id}'`, "", "LIMIT 1");
        if(!user) {
          return functionObj.output(404, "User not found", null);
        }
        const userid = user[0].id;

        const bookingData = await this.select("bookings", "*", `WHERE id = '${booking_id}'`, "", "LIMIT 1");
        if(!bookingData) {
          return functionObj.output(404, "Booking not found", null);
        }
      
        const scheduleid = bookingData[0].booking_schedule_id;

        await this.update("seats", { seat_is_booked: false, updated_ip: ip }, 
          `WHERE seat_schedule_id = ${scheduleid} 
          AND id IN (
          SELECT bookingdetails_seat_id FROM booking_details WHERE bookingdetails_booking_id = ${booking_id})
          `);

        await this.delete("booking_details", `WHERE bookingdetails_booking_id = ${booking_id}`);

        const seatQuery = `SELECT id, seat_number, seat_is_booked FROM seats WHERE seat_schedule_id = ${scheduleid} AND seat_number IN (${seat_numbers.map(s => `'${s}'`).join(",")})`;
        const seatData = await this.executeQuery(seatQuery);

        if(seatData.length !== seat_numbers.length){
          return functionObj.output(404, "Some Seats not found", null);
        }

        const unavailableSeats = seatData.filter((seat: { seat_is_booked: any; }) => seat.seat_is_booked);
        if(unavailableSeats.length > 0) {
          return functionObj.output(404, "Some Seats are already booked", unavailableSeats);
        }

        const scheduleData = await this.select("flight_schedules", "schedule_price_per_seat", `WHERE id = ${scheduleid}`,"", "");
        const pricePerSeat = scheduleData[0].schedule_price_per_seat;
        const totalPrice = pricePerSeat * seatData.length;

        for (let i = 0; i < passengers.length; i++) {
          const seat = seatData.find((s: { seat_number: string }) => s.seat_number === seat_numbers[i]);
          const passenger = passengers[i];

          await this.insert("booking_details", {
            bookingdetails_booking_id: booking_id,
            bookingdetails_user_id: userid,
            bookingdetails_passenger_name: passenger.name,
            bookingdetails_fare: Number (pricePerSeat),
            bookingdetails_seat_id: seat.id,
            created_ip: ip
          })

          await this.update("seats", { seat_is_booked: true, updated_ip: ip }, `WHERE id = ${seat.id}`);
        }

        await this.update("bookings", {
          booking_status: status,
          booking_total_price: totalPrice,
          updated_ip: ip
        }, `WHERE id = ${booking_id}`);

        return functionObj.output(200, "Booking updated successfully", {booking_id,updated_seats: seat_numbers});

      }catch(error){
        // console.log('====================================');
        // console.log("error", error);
        // console.log('====================================');
        return functionObj.output(500, "Error in updating bookings", error);
      }
    }
    
    async cancleBooking(booking_id: number, user_id: string, ip: string): Promise<ServiceResponse> {
      try{
        const user = await this.select("users", "id", `WHERE id  = '${user_id}'`, "", "LIMIT 1");
        if(!user) {
          return functionObj.output(404, "User not found", null);
        }
        const userid = user[0].id;

        const bookingData = await this.select("bookings", "*", `WHERE id = '${booking_id}'`, "", "LIMIT 1");
        if(!bookingData) {
          console.log("bookingData", bookingData);
          return functionObj.output(404, "Booking not found", null);
        }

        const bookingdetails = await this.select("booking_details", "bookingdetails_seat_id", `WHERE bookingdetails_booking_id = '${booking_id}'`, "", "");
        const seatids = bookingdetails.map((detail:any) => detail.bookingdetails_seat_id);

        await this.update("bookings", {
          booking_status: "cancelled",
          booking_refund_status: true,
          updated_ip: ip
        }, `WHERE id = ${booking_id}`);

        if(seatids.length > 0) {
          const seats = seatids.join(",");
          let query = `UPDATE seats SET seat_is_booked = false, updated_ip = '${ip}' WHERE id IN (${seats})`;
          await this.executeQuery(query);
        }

        return functionObj.output(200, "Booking cancelled successfully", {booking_id,unbooked_seats: seatids});
      }catch(error){
        return functionObj.output(500, "Error in cancleing booking", error);
      }
    }
}