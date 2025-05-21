import { appdb } from "./appdb";
import { functions } from '../library/functions';
import { companiesModel } from "./companiesModel";

const functionObj  = new functions();
const companyObj = new companiesModel();

interface ServiceResponse {
    error: boolean;
    message: string;
    data: any;
}

export class airplanesModel extends appdb {
    constructor() {
        super();
        this.table = 'airplanes';
        this.uniqueField = 'id';
    }

    async createAirplane(airplane_name: string, airplane_total_seats: number, id: number, ip: string): Promise<ServiceResponse> {
        try {
          const company = await companyObj.getCompanieById(id);
      
          if (company.error || !company.data) {
            return functionObj.output(401, "Company Not Found", null);
          }
      
          const result = await this.insertRecord({
            airplane_name,
            airplane_total_seats,
            airplane_company_id: id, 
            created_ip: ip,
          });
      
          return functionObj.output(200, "AirPlane Created Successfully", result);
        } catch (error) {
          return functionObj.output(500, "Error In AirPlanesModel", error);
        }
    }

    async getAllAirplane(): Promise<ServiceResponse> {
        try{
            const result = await this.allRecords("*");

            if(!result){
                return functionObj.output(404, "Airplanes not found", null);
            }

            return functionObj.output(200, "Fetching Airplanes Successfully", result);
        }catch(error){
            return functionObj.output(500, "Error In AirPlanesModel", error);
        }
    }

    async getAirplaneById(id: number): Promise<ServiceResponse>{
        try{
            const result =  await this.selectRecord(id);

            if(!result){
                return functionObj.output(404, "Result not Found", null);
            }

            return functionObj.output(200, "Airplane Fetched successfully", result);
        }catch(error){
            return functionObj.output(500, "Error In AirPlanesModel", error);
        }
    }

    async updateAirplane(id: number, updateData: { airplane_name?: string; airplane_total_seats?: number; }, ip: number): Promise<ServiceResponse> {
        try{
            const result = await this.updateRecord(id, { ...updateData, updated_ip: ip});

            return functionObj.output(200, "Airplane updated successfully", result);
        }catch(error){
            return functionObj.output(500, "Error in Airplanes", error);
        }
    }

    async deleteAirplane(id: number): Promise<ServiceResponse>{
        try{
            const result =  await this.deleteRecord(id);

            if(!result){
                return functionObj.output(404, "Result not Found", null);
            }

            return functionObj.output(200, "Airplane Deleted successfully", result);
        }catch(error){
            return functionObj.output(500, "Error In AirPlanesModel", error);
        }
    }

    async getAirplaneByCompanyId(id: number): Promise<ServiceResponse> {
        try{
            this.where = `where airplane_company_id = ${id}`;
            const result = await this.listRecords("*");
            return functionObj.output(200, "Airplane Fetched Successfully", result);
        }catch(error){
            return functionObj.output(500, "Error In AirPlanesModel", error);
        }
    }

    async getAirplaneByCompanyName(company_name: string): Promise<ServiceResponse>{
        try{
            const query = `
            SELECT a.*
            FROM airplanes a
            JOIN companies c ON a.airplane_company_id = c.id
            WHERE c.company_name = '${company_name}';
            `;

            const result = await this.executeQuery(query);

            if(!result) {
                return functionObj.output(401,"Flight not found", null);
            }

            return functionObj.output(200, "Airplanes fetched successfully", result);
        }catch(error){
            return functionObj.output(500, "Error in fetching airplanes", error);
        }
    }
}