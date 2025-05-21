import dotenv from 'dotenv'
import { Pool } from 'pg';

dotenv.config();

export class connection {
	static connection: any;

	async getConnection() {
		if (!connection.connection) {
			let result = await this.connect();
			if (!result) return false;
		}
		return connection.connection;
	}

	async connect() {
		connection.connection = new Pool({
                host : process.env['DB_HOST'],
                user : process.env['DB_USER'],
                port : Number(process.env['DB_PORT']),
                database : process.env['DB_NAME'],
                password : process.env['DB_PASS'],		
            });

		try {
			let result = await connection.connection.connect();
			if (result) {
				console.log('Database Connected!');
			}
			return result;
		} catch (error) {
			console.log(error);
			connection.connection = false;
			return false;
		}
	}
}

