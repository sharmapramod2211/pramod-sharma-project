import express from 'express'
import index from './v1/index';
import cors from 'cors'; 
import dotenv from 'dotenv';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/v1/api', index);

app.listen( process.env.PORT,()=>{
    console.log("Server is running...");
})

