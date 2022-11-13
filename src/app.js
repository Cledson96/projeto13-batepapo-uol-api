import express from "express"
import cors from "cors"
import { ConnectionClosedEvent, MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

const app = express();
app.use(express.json());
const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;
let usuarios;

mongoClient.connect().then(() => {
    db = mongoClient.db("uol");

});




app.post("/participants", async (req, res) => {
    const body = req.body;

    usuarios = await db.collection("usuarios").find({}).toArray();

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
        await db.collection("message").insertOne({ from: req.body.name, to: "Todos", text: 'entra na sala...', type: 'status', time: dayjs().format("HH:mm:ss") });

        res.status(201).send("usuario cadastrado com sucesso!");
    } catch (err) {
        res.status(500).send(err);
    }

})

app.get("/participants", async (req, res) => {

    res.send(await db.collection("usuarios").find({}).toArray());


})

app.post("/messages", async (req, res) => {
    const body = req.body;
    let valida
    if (body.type == "message" || body.type == "private_message") {
        valida = false;
    } else {
        valida = true;
    }
    const from = req.headers.users
    const messageSchema = joi.object({
        to: joi.string().required().min(1).max(100),
        text: joi.string().required(),
        type: joi.string().required(),
    });
    const validation = messageSchema.validate(body, { abortEarly: false });
    if (validation.error || valida) {
        res.status(422).send("Erro no envio");
        return
    }
})




app.listen(5000, () => {
    console.log(`Server running in port: ${5000}`);
});