import { appdb } from "./appdb";
import { functions } from "../library/functions";

const functionObj = new functions();

interface ServiceResponse {
    error: boolean;
    message: string;
    data: any;
}

export class companiesModel extends appdb {
    constructor() {
        super();
        this.table = 'companies';
        this.uniqueField = 'id';
    }

    async createCompanies(company_name: string, company_logo: string, ip: string): Promise<ServiceResponse> {
        try {
            const newCompany = await this.insertRecord({ company_name, company_logo, created_ip: ip });

            if (newCompany.error) {
                return functionObj.output(401, "Error Adding Company", newCompany.error);
            }

            return functionObj.output(200, "Company Adding Successfully", newCompany.data);
        } catch (error) {
            return functionObj.output(500, "Error Fetching In Company", null);
        }
    }

    async getCompanieById(id: number): Promise<ServiceResponse> {
        try {
            const company = await this.selectRecord(id);

            if (company.error) {
                return functionObj.output(401, "Company not found", null);
            }
            return functionObj.output(200, "Company Fetched Successfully", company);
        } catch (error) {
            return functionObj.output(500, "Error Fetching In Company", null);
        }
    }

    async updateCompany(id: number, updateData: { company_name?: string; company_logo?: string; updated_ip: string }): Promise<ServiceResponse> {
        try {
            const updatedCompany = await this.updateRecord(id, updateData);

            if (updatedCompany.error) {
                return functionObj.output(401, "Company not found", null);
            }

            return functionObj.output(200, "Company Updated Successfully", updatedCompany);
        } catch (error) {
            return functionObj.output(500, "Error Updating Company", null);
        }
    }

    async getAllCompany(): Promise<ServiceResponse> {
        try {
            const rows = await this.allRecords("*");

            if (!rows) {
                return functionObj.output(401, "Company not found", null);
            }
            return functionObj.output(200, "Company Fetching Successfully", rows);
        } catch (error) {
            return functionObj.output(500, "Error Fetching Company", null);
        }
    }
}