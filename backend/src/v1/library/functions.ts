import fs from "fs";
import ini from "ini";
import path from "path";
import { Response } from "express";

export class functions {
    static static_languagevars: any = {};
    public languagevars: any = {};
    protected language: string = '';

    constructor() {
        this.language = 'english';
        this.languagevars = this.getLanguageData();
    }

    /**
     * Get language.ini variable to be available in the whole app
     */
    getLanguageData() {
        if (!functions.static_languagevars || Object.keys(functions.static_languagevars).length === 0) {
            const iniPath = path.join(__dirname, '../../../', 'language.ini');

            // Check if the file exists
            if (!fs.existsSync(iniPath)) {
                console.error("Error: language.ini file not found at", iniPath);
                functions.static_languagevars = {}; // Set as empty object to avoid errors
                return functions.static_languagevars;
            }

            try {
                let languageArray = ini.parse(fs.readFileSync(iniPath, 'utf-8'));
                functions.static_languagevars = languageArray[this.language] || {}; // Ensure it's an object
            } catch (error) {
                console.error("Error reading language.ini:", error);
                functions.static_languagevars = {}; // Prevent further errors
            }
        }
        return functions.static_languagevars;
    }
    /**
     * Send output to client with status code and message
     */
    output(status_code: number, status_message: any, data: any = null) {
        if (this.languagevars && this.languagevars[status_message]) {
            status_message = this.languagevars[status_message];
        }

        return {
            status_code: status_code.toString(),
            // status_message: status_message,
            error: status_code >= 400,
            message: status_message,
            datetime: new Date(),
            data: data
        };
    }

    returnResponse (error: boolean, message: string, data: any) {
        return { error, message, data };
    };

    SuccessResponse  (res: Response, message: string, data: any)  {
        res.status(200).json({
           error: false,
           message,
           data,
       }); return;
   };
   
     errorResponse  (res: Response, statusCode: number, message: string, data: any = null)  {
        res.status(statusCode).json({
           error: true,
           message,
           data,
       });return;
   };
}
