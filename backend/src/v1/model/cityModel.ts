import { appdb } from "./appdb";
import { functions } from "../library/functions";

const functionObj = new functions();

interface ServiceResponse {
    error: boolean;
    message: string;
    data: any;
}

export class cityModel extends appdb {
    constructor() {
        super();
        this.table = 'cities';
        this.uniqueField = 'id';
    }

    async addCity(city_name:string, city_state:string, city_country:string, ip: string): Promise<ServiceResponse> {
        try {
            const result = await this.insertRecord({
               city_name, 
               city_state,
               city_country,
               created_ip: ip
            });
            return functionObj.output(201, "City added successfully", result);
        } catch (error) {
            console.error("Error adding city:", error);
            return functionObj.output(500, "Error adding city", null);
        }
    }

    async getAllCities(): Promise<ServiceResponse> {
        try {
            const cities = await this.allRecords();
            return functionObj.output(200, "Cities fetched successfully", cities);
        } catch (error) {
            return functionObj.output(500, "Failed to fetch cities", null);
        }
    }

    async getCityById(id: number): Promise<ServiceResponse> {
        try {
            const city = await this.selectRecord(id); 
            return functionObj.output(200, "City fetched", city);
        } catch (error) {
            return functionObj.output(500, "Failed to fetch city", null);
        }
    }

    async updateCity(id: number, city_name: string): Promise<ServiceResponse> {
        try {
            const result = await this.updateRecord(id, { city_name });
            return functionObj.output(200, "City updated successfully", result);
        } catch (error) {
            return functionObj.output(500, "Failed to update city", null);
        }
    }

    async deleteCity(id: number): Promise<ServiceResponse> {
        try {
            const result = await this.deleteRecord(id);
            return functionObj.output(200, "City deleted successfully", result);
        } catch (error) {
            return functionObj.output(500, "Failed to delete city", null);
        }
    }

    async getCityByName(city_name: string): Promise<ServiceResponse> {
        try {
            const result = await this.select("cities", "id", `
                where city_name = '${city_name}'`, "", ""
            );

            if (result.length > 0) {
                return functionObj.output(200, "City found", result);
            } else {
                return functionObj.output(404, "City not found", []);
            }
        } catch (error) {
            return functionObj.output(500, "Error fetching city", null);
        }
    }
}