import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";

const app = express();
app.use(express.json());
const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("uol"); 
});
const receitaSchema = joi.object({
    name: joi.string().required().min(3).max(100),
    ingredientes: joi.string().required(),
    preparo: joi.string().required(),
  });
  

app.post("/participants",async (req,res)=>{

   if(!req.body.name){
    res.status(422).send("name deve ser strings não vazio");
    return
   }
   try {
    await db.collection("usuarios").insertOne({name: req.body.name , lastStatus: Date.now()});
    res.status(201).send("usuario cadastrado com sucesso!");
  } catch (err) {
    res.status(500).send(err);
  }
  
})

app.listen(5000, () => {
    console.log(`Server running in port: ${5000}`);
  });