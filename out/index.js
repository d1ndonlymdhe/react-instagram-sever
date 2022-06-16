"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const User_1 = __importDefault(require("./User"));
mongoose_1.default.connect("mongodb://127.0.0.1:27017/instagram");
const app = (0, express_1.default)();
const PORT = process.env.port || 4000;
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.listen(PORT, () => {
    console.log("listening on port " + PORT);
});
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    let status = "error";
    let message = "unknown";
    findUser(username).then(user => {
        console.log(user);
        if (user == null) {
            message = "Incorrect Username";
        }
        else {
            if (user.password === password) {
                status = "ok";
                message = "ok";
            }
            else {
                message = "Incorrect Password";
            }
        }
        res.send(JSON.stringify({ status, message }));
    });
});
app.post("/signup", (req, res) => {
    const { username, password } = req.body;
    let status = "error";
    let message = "unknown error occured";
    findUser(username).then(user => {
        console.log(user);
        if (user == null) {
            status = "ok";
            message = "Success, go back to login";
            newUser(username, password);
        }
        else {
            status = "error";
            message = "Username taken";
        }
        res.send(JSON.stringify({ status, message }));
    });
});
async function newUser(username, password) {
    const user = new User_1.default({ username: username, password: password });
    await user.save();
}
async function findUser(username) {
    const user = await User_1.default.findOne({ username: username });
    return user;
}
