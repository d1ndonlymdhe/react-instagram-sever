import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import User from "./User";
mongoose.connect("mongodb://127.0.0.1:27017/instagram")
const app = express();
const PORT = process.env.port || 4000;
app.use(bodyParser.json());
app.use(cors())
app.listen(PORT, () => {
    console.log("listening on port " + PORT);
})

app.post("/login", (req, res) => {
    const { username, password } = <signUpReq>req.body;
    let status = "error";
    let message = "unknown";
    findUser(username).then(user => {
        console.log(user);
        if (user == null) {
            message = "Incorrect Username"
        } else {
            if (user.password === password) {
                status = "ok";
                message = "ok";
            } else {
                message = "Incorrect Password";
            }
        }
        res.send(JSON.stringify({ status, message }));
    })
})
app.post("/signup", (req, res) => {
    const { username, password } = <signUpReq>req.body;
    let status = "error";
    let message = "unknown error occured";
    findUser(username).then(user => {
        console.log(user);
        if (user == null) {
            status = "ok";
            message = "Success, go back to login";
            newUser(username, password)
        } else {
            status = "error";
            message = "Username taken";
        }
        res.send(JSON.stringify({ status, message }));
    })
})
async function newUser(username: string, password: string) {
    const user = new User({ username: username, password: password });
    await user.save();
}

async function findUser(username: string) {
    const user = await User.findOne({ username: username });
    return user;
}