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
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const hash_sum_1 = __importDefault(require("hash-sum"));
mongoose_1.default.connect("mongodb://127.0.0.1:27017/instagram");
const app = (0, express_1.default)();
const PORT = process.env.port || 4000;
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
const whiteList = ["http://localhost:3000", "http://127.0.0.1:300", "http://192.168.0.65:3000"];
const corsOptions = {
    credentials: true,
    origin: function (origin, callback) {
        if (whiteList.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
app.use((0, cors_1.default)(corsOptions));
app.listen(PORT, () => {
    console.log("listening on port " + PORT);
});
app.post("/userInfo", (req, res) => {
    const { hash } = req.body;
    findUser(undefined, hash).then((user) => {
        if (user !== null) {
            res.send(JSON.stringify({
                status: "ok",
                message: {
                    username: user.username,
                    following: user.following,
                    followersCount: user.followersCount,
                    firstLogin: user.firstLogin
                }
            }));
        }
        else {
            res.send(JSON.stringify({
                status: "error",
                message: {
                    text: "No such user"
                }
            }));
        }
    });
});
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    let status = "error";
    let message = {
        text: "unknown error"
    };
    findUser(username).then(user => {
        console.log(user);
        if (user == null) {
            message = {
                text: "Incorrect Username"
            };
        }
        else {
            if (user.password === password) {
                status = "ok";
                const uniqueHash = (0, hash_sum_1.default)(user._id);
                message = {
                    text: "ok",
                    hash: uniqueHash,
                };
                updateUser(username, { hash: uniqueHash });
                res.send(JSON.stringify({ status, message }));
                return;
            }
            else {
                message = {
                    text: "Incorrect Username"
                };
                res.send(JSON.stringify({ status, message }));
                return;
            }
        }
        res.send(JSON.stringify({ status, message }));
        return;
    });
});
app.post("/signup", (req, res) => {
    const { username, password } = req.body;
    let status = "error";
    let message = {
        text: "Unknown error occured"
    };
    findUser(username).then(user => {
        console.log(user);
        if (user == null) {
            status = "ok";
            message = {
                text: "ok"
            };
            newUser(username, password);
        }
        else {
            status = "error";
            message = {
                text: "Username Taken"
            };
        }
        res.send(JSON.stringify({ status, message }));
    });
});
async function newUser(username, password) {
    const user = new User_1.default({ username: username, password: password });
    await user.save();
}
async function updateUser(username, options) {
    const { following, followersCount, password, newUsername, hash } = options;
    const user = await User_1.default.findOne({ username: username });
    if (following !== undefined) {
        user.following = following;
    }
    if (followersCount !== undefined) {
        user.followersCount = followersCount;
    }
    if (password !== undefined) {
        user.password = password;
    }
    if (newUsername !== undefined) {
        user.username = newUsername;
    }
    if (hash !== undefined) {
        user.hash = hash;
    }
    await user.save();
}
async function findUser(username, hash) {
    if (username !== undefined) {
        const user = await User_1.default.findOne({ username: username });
        return user;
    }
    else if (hash !== undefined) {
        const user = await User_1.default.findOne({ hash: hash });
        return user;
    }
}
