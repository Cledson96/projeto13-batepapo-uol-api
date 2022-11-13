import express from "express"
import cors from "cors"
import { ConnectionClosedEvent, MongoClient, ObjectId } from "mongodb";
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



app.post("/participants", async (req, res) => {
    const body = req.body;

    let usuarios = await db.collection("usuarios").find({}).toArray();

    const verificador = usuarios.find(verifica => verifica.name === req.body.name)

    if (verificador) {
        res.status(409).send("Já existe um usuario com este nome!")
        return
    }

    const nameSchema = joi.object({
        name: joi.string().required().min(1).max(100)
    });

    const validation = nameSchema.validate(body, { abortEarly: false });

    if (validation.error) {
        res.status(422).send("name deve ser strings não vazia");
        return
    }
    try {
        await db.collection("usuarios").insertOne({ name: req.body.name, lastStatus: Date.now() });
        res.status(201).send("usuario cadastrado com sucesso!");
    } catch (err) {
        res.status(500).send(err);
    }

})

app.listen(5000, () => {
    console.log(`Server running in port: ${5000}`);
});