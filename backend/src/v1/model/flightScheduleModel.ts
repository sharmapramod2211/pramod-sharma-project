import { appdb } from "./appdb";
import { functions } from "../library/functions";

const functionObj = new functions();

interface flights {
  schedule_airplane_id: number;
  schedule_from_city_id: number;
  schedule_to_city_id: number;
  schedule_departure_time: string;
  schedule_arrival_time: string;
  schedule_duration: string;
  schedule_price_per_seat: number;
  schedule_available_seats: number;
  schedule_departure_platform: string;
  schedule_arrival_platform: string;
}

interface ServiceResponse {
  error: boolean;
  message: string;
  data: any;
}

export class flightScheduleModel extends appdb {
  constructor() {
    super();
    (this.table = "flight_schedules"), (this.uniqueField = "id");
  }

  async createflightSchedule(
    flightData: Omit<flights, "schedule_available_seats">,
    ip: string
  ): Promise<ServiceResponse> {
    try {
      const query = `SELECT airplane_total_seats FROM airplanes WHERE id = ${flightData.schedule_airplane_id}`;
      const result = await this.executeQuery(query);

      if (!result) {
        return functionObj.output(404, "Airplane not found", null);
      }

      const availableSeats = result[0].airplane_total_seats;

      const citiquery = `SELECT id FROM cities WHERE id IN (${flightData.schedule_from_city_id}, ${flightData.schedule_to_city_id})`;
      const citiResult = await this.executeQuery(citiquery);

      if (!citiResult) {
        return functionObj.output(404, "Cities not found", null);
      }

      const insertFlights = await this.insertRecord({
        ...flightData,
        schedule_available_seats: availableSeats,
        created_ip: ip,
      });

      if (insertFlights.error) {
        return functionObj.output(401, "flight not created", insertFlights);
      }

      const flightSchedule = insertFlights;

      for (let i = 1; i <= availableSeats; i++) {
        const seatInsertQuery = `INSERT INTO seats (seat_schedule_id, seat_number, seat_is_booked, seat_order, created_ip)
              VALUES (${flightSchedule}, 'S${i}', false, NULL, '${ip}')
              `;
        await this.executeQuery(seatInsertQuery);
      }

      return functionObj.output(
        200,
        "Flight Schedule and Seats Created Successfully",
        {
          schedule_id: flightSchedule,
          total_seats: availableSeats,
        }
      );
    } catch (error) {
      return functionObj.output(500, "Error in CreatingFlightSchedule", error);
    }
  }

  async findScheduleByID(id: number): Promise<ServiceResponse> {
    try {
      const result = await this.selectRecord(id);

      if (!result) {
        return functionObj.output(404, "Flight not found", null);
      }

      return functionObj.output(200, "Flights Fetch Successfully", result);
    } catch (error) {
      return functionObj.output(500, "Error in CreatingFlightSchedule", error);
    }
  }

  async getAllFlightSchedule(): Promise<ServiceResponse> {
    try {
      const result = await this.allRecords("*");

      if (!result) {
        return functionObj.output(404, "flightSchedules not found", null);
      }

      return functionObj.output(
        200,
        "Fetching FlightSchedule Successfully",
        result
      );
    } catch (error) {
      return functionObj.output(500, "Error fetching flightSchedule", error);
    }
  }

  async updateFlightSchedule(
    id: number,
    flightData: Omit<flights, "schedule_available_seats">,
    ip: string
  ): Promise<ServiceResponse> {
    try {
      const exsistQuery = `SELECT id FROM flight_schedules WHERE id = ${id}`;
      const exsistResult = await this.executeQuery(exsistQuery);
      if (!exsistResult) {
        return functionObj.output(404, "Data not found", null);
      }

      const query = `SELECT airplane_total_seats FROM airplanes WHERE id = ${flightData.schedule_airplane_id}`;
      const result = await this.executeQuery(query);
      if (!result) {
        return functionObj.output(404, "Airplane not found", null);
      }

      const availableSeats = result[0].airplane_total_seats;

      const citiquery = `SELECT id FROM cities WHERE id IN (${flightData.schedule_from_city_id}, ${flightData.schedule_to_city_id})`;
      const citiResult = await this.executeQuery(citiquery);

      if (!citiResult) {
        return functionObj.output(404, "Cities not found", null);
      }

      const updateQuery = `
      UPDATE flight_schedules 
      SET 
        schedule_airplane_id = COALESCE(${flightData.schedule_airplane_id}, schedule_airplane_id),schedule_from_city_id = COALESCE(${flightData.schedule_from_city_id}, schedule_from_city_id),schedule_to_city_id = COALESCE(${flightData.schedule_to_city_id}, schedule_to_city_id),schedule_departure_time = COALESCE('${flightData.schedule_departure_time}', schedule_departure_time),schedule_arrival_time = COALESCE('${flightData.schedule_arrival_time}', schedule_arrival_time),schedule_duration = COALESCE('${flightData.schedule_duration}', schedule_duration),schedule_price_per_seat = COALESCE(${flightData.schedule_price_per_seat}, schedule_price_per_seat),schedule_available_seats = COALESCE(${availableSeats}, schedule_available_seats),schedule_departure_platform = COALESCE('${flightData.schedule_departure_platform}', schedule_departure_platform),schedule_arrival_platform = COALESCE('${flightData.schedule_arrival_platform}', schedule_arrival_platform),updated_ip = COALESCE('${ip}', updated_ip)WHERE id = ${id};
      `;
      const updateResult = await this.executeQuery(updateQuery);
      // console.log('====================================');
      // console.log("updated", updateResult);
      // console.log('====================================');

      if (!updateResult) {
        return functionObj.output(404, "Flight Schedule not updated", null);
      }

      const deleteQuery = `DELETE FROM seats WHERE seat_schedule_id = ${id}`;
      await this.executeQuery(deleteQuery);

      for (let i = 1; i <= availableSeats; i++) {
        const seatInsertQuery = `INSERT INTO seats (seat_schedule_id, seat_number, seat_is_booked, seat_order, created_ip)
          VALUES (${id}, 'S${i}', false, NULL, '${ip}')
          `;
        await this.executeQuery(seatInsertQuery);
      }

      return functionObj.output(200, "Flight schedule updated successfully", {
        schedule_id: id,
        total_seats: availableSeats,
      });
    } catch (error) {
      console.log('====================================');
      console.log("error", error);
      console.log('====================================');
      return functionObj.output(500, "Error in Updating FlightSchedule", error);
    }
  }

  async deleteFlightSchedule(id: number): Promise<ServiceResponse> {
    try {
      const deleteSeats = await this.delete(
        "seats",
        `WHERE seat_schedule_id = ${id}`
      );

      if (deleteSeats === false) {
        return functionObj.output(500, "Failed to delete seats", null);
      }

      const deleteSchedule = await this.delete(
        "flight_schedules",
        `WHERE id = ${id}`
      );
      if (deleteSchedule === false) {
        return functionObj.output(
          500,
          "Failed to delete flight schedule",
          null
        );
      }
      return functionObj.output(200, "Deleting Successfully", { id });
    } catch (error) {
      return functionObj.output(500, "Error in deleting flightSchedule", error);
    }
  }

  async getFlightScheduleByCity(
    schedule_from_city: string,
    schedule_to_city: string,
    date?: string
  ): Promise<ServiceResponse> {
    try {
      const fromCityResult = await this.select(
        "cities",
        "id",
        `WHERE city_name = '${schedule_from_city}'`,
        "",
        "LIMIT 1"
      );
      if (!fromCityResult || fromCityResult.length === 0) {
        return functionObj.output(404, "From city not found", null);
      }

      const toCityResult = await this.select(
        "cities",
        "id",
        `WHERE city_name = '${schedule_to_city}'`,
        "",
        "LIMIT 1"
      );
      if (!toCityResult || toCityResult.length === 0) {
        return functionObj.output(404, "To city not found", null);
      }

      const fromCityId = fromCityResult[0].id;
      const toCityId = toCityResult[0].id;

      let where = `WHERE schedule_from_city_id = ${fromCityId} AND schedule_to_city_id = ${toCityId}`;
      if (date) {
        where += ` AND DATE(schedule_departure_time) = '${date}'`;
      }

      const scheduleQuery = `
        SELECT * FROM flight_schedules
        ${where}
        ORDER BY schedule_departure_time ASC
      `;
      // console.log('====================================');
      // console.log("query", scheduleQuery);
      // console.log('====================================');
      const scheduleResult = await this.executeQuery(scheduleQuery);
      // console.log('====================================');`
      // console.log("scheduleResult", scheduleResult);
      // console.log('====================================');

      if (!scheduleResult || scheduleResult.length === 0) {
        return functionObj.output(404, "No flight schedules found", null);
      }

      return functionObj.output(
        200,
        "Flight schedules fetched successfully",
        scheduleResult
      );
    } catch (error) {
      return functionObj.output(500, "Error fetching flight schedules", error);
    }
  }

  async getseats(schedule_id: number): Promise<ServiceResponse> {
    try {
      const schedule = await this.select(
        "flight_schedules",
        "*",
        `WHERE id = '${schedule_id}'`,
        "",
        ""
      );
      if (!schedule) {
        return functionObj.output(404, "Schedule not found", null);
      }

      const query = `
        SELECT id, seat_number, seat_is_booked 
        FROM seats 
        WHERE seat_schedule_id = '${schedule_id}' ORDER BY seat_number ASC
      `;
      const seatData = await this.executeQuery(query);

      return functionObj.output(200, "SeatsData", seatData);
    } catch (error) {
      return functionObj.output(500, "Error in geting seats", error);
    }
  }
}
