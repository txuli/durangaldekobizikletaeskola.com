import { betterAuth } from "better-auth";
import { createPool } from "mysql2/promise";

import dotenv from 'dotenv';
dotenv.config();

export const auth = betterAuth({
    
    
    database: createPool({
         host: process.env.DB_HOST || '',
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || '',
       
    }),
    emailAndPassword: {    
        enabled: true
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, 
        updateAge: 60 * 60 * 24 
    }
    
   
});

export default auth;

