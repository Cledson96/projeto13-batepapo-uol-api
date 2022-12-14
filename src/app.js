import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";
import { stripHtml } from "string-strip-html";


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
let usuarios;

mongoClient.connect().then(() => {
    db = mongoClient.db("uol");

});





app.post("/participants", async (req, res) => {
    const body = req.body;
    let namelimpo = stripHtml(body.name).result
    let fromlimpo = stripHtml(body.name).result

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
        await db.collection("usuarios").insertOne({ name: namelimpo, lastStatus: Date.now() });
        await db.collection("message").insertOne({ from: fromlimpo, to: "Todos", text: 'entra na sala...', type: 'status', time: dayjs().format("HH:mm:ss") });

        res.status(201).send("usuario cadastrado com sucesso!");
    } catch (err) {
        res.status(500).send(err);
    }

})

setInterval(async remove => {
    usuarios = await db.collection("usuarios").find({}).toArray();

    for (let i = 0; i < usuarios.length; i++) {
        if (Math.abs(Date.now() - usuarios[i].lastStatus) > 10000) {

            try {

                await db.collection("usuarios").deleteOne({ _id: usuarios[i]._id });
                await db.collection("message").insertOne({ from: usuarios[i].name, to: "Todos", text: 'sai da sala...', type: 'status', time: dayjs().format("HH:mm:ss") });

            }
            catch (err) {

            }

        }
    }



}, 15000)
app.get("/participants", async (req, res) => {

    res.send(await db.collection("usuarios").find({}).toArray());


})

app.post("/messages", async (req, res) => {
    const body = req.body;
    let textlimpo = stripHtml(body.text).result
    console.log(textlimpo);
    console.log(body.text);
    if (!req.headers.user) {
        res.status(422).send("Obrigatório mandar o user no headers");
    }

    let valida
    if (body.type == "message" || body.type == "private_message") {
        valida = false;
    } else {
        valida = true;
    }
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
    try {
        await db.collection("message").insertOne({ from: req.headers.user, to: req.body.to, text: textlimpo, type: req.body.type, lastStatus: dayjs().format("HH:mm:ss") });
        res.status(201).send("ok");
        console.log(req.headers.user)
        return
    } catch (err) {
        res.status(500).send(err);
        return
    }

})


app.get("/messages", async (req, res) => {
    const mensagens = await db.collection("message").find({}).toArray()
    const limit = parseInt(req.query.limit);
    console.log(limit)

    let envio = [];
    mensagens.map(ref => {
        if (ref.to == req.headers.user || ref.type == "message" || ref.type == "status") {
            envio.push(ref)
        }


    })
    if (limit && limit < envio.length) {
        res.send(envio.slice(envio.length - limit))
        return
    }
    res.send(envio);

})

app.post("/status", async (req, res) => {
    let usuari = await db.collection("usuarios").find({}).toArray();
    const verificador = usuari.find(verifica => verifica.name === req.headers.user)
    if (!verificador) {
        res.status(404).send("Usuario não encontrado")
        console.log(usuari)
        return
    }

    try {
        await db.collection("usuarios").updateOne({ _id: verificador._id }, { $set: { lastStatus: Date.now() } });

        res.status(200).send("Atualizado!");
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }



})

app.delete("/messages/:ID_DA_MENSAGEM", async (req, res) => {
    let user = req.headers.user;
    let { ID_DA_MENSAGEM } = req.params;

    try {
        let mensage = await db.collection("message").findOne({ _id: new ObjectId(ID_DA_MENSAGEM) });
        console.log(mensage);

        if (!mensage) {
            res.status(404).send("erro")
            return
        }
        if (mensage.from != user) {
            res.status(401).send("erro")
            return
        }
        const resp = await db
            .collection("message")
            .deleteOne({ _id: ObjectId(ID_DA_MENSAGEM) });

        console.log(resp);
        res.send("Mensagem apagada com sucesso!");
    } catch (err) {
        console.log(err);
        res.sendStatus(404);
    }

})
app.put("/messages/:ID_DA_MENSAGEM", async (req, res) => {
    let { ID_DA_MENSAGEM } = req.params;
    let body = req.body;
    let from = req.headers.user
   let usu = await db.collection("usuarios").find({}).toArray();
   let usua = false;

   for(let i = 0;i<usu.length;i++){
    if (usu[i] == from){
        usua = true;
    }
   }
    const messageSchema = joi.object({
        to: joi.string().required().min(1).max(100),
        text: joi.string().required(),
        type: joi.string().required(),
    });
    let valida
    if (body.type == "message" || body.type == "private_message") {
        valida = false;
    } else {
        valida = true;
    }

    const validation = messageSchema.validate(body, { abortEarly: false });
    if (validation.error || valida || usua) {
        res.status(422).send("Erro no envio");
        console.log(!usua)
        console.log(validation.error)
        console.log(valida)
        return
    }
    try {
        let mensage = await db.collection("message").findOne({ _id: new ObjectId(ID_DA_MENSAGEM) });
        console.log(mensage);

        if (!mensage) {
            res.status(404).send("erro")
            return
        }
        if (mensage.from != from){
            res.status(401).send("erro")
            return
        }
        
        const resp = await db
            .collection("message")
            .updateOne({ _id: ObjectId(ID_DA_MENSAGEM) },{ $set: req.body.text });

        console.log(resp);
        res.send("Mensagem atualizada com sucesso!");
    } catch (err) {
        console.log(err);
        res.sendStatus(404);
    }

})
app.listen(5000, () => {
    console.log(`Server running in port: ${5000}`);
});