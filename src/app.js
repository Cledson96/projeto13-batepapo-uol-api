import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";

const app = express();

const receitaSchema = joi.object({
    name: joi.string().required().min(3).max(100),
    ingredientes: joi.string().required(),
    preparo: joi.string().required(),
  });
  

app.post("/participants",async (req,res)=>{

   if(!req.body.name){
    res.status(422).send("name deve ser strings não vazio");
   }
})

app.listen(5000, () => {
    console.log(`Server running in port: ${5000}`);
  });