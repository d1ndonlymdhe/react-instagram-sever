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
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const fs_1 = __importDefault(require("fs"));
const apollo_server_express_1 = require("apollo-server-express");
// import User from "./Schema";
mongoose_1.default.connect("mongodb://127.0.0.1:27017/instagram");
const typeDefs = (0, apollo_server_express_1.gql) `
type Query {
    userFromUsername(username: String!): User,
    userFromHash(hash: String!): User,
}
type User {
    username: String,
    password: String,
    hash:String,
    bio:String,
    following: Int,
    followersCount: Int,
    firstLogin: Boolean,
    _id: String,
}
`;
const resolvers = {
    Query: {
        //@ts-ignore
        async userFromUsername(obj, args, context, info) {
            const username = args.username;
            console.log(username);
            const user = await findUser(username);
            return user;
        },
        //@ts-ignore
        async userFromHash(obj, args, context, info) {
            const hash = args.hash;
            const user = await findUser(undefined, hash);
            return user;
        }
    }
};
const app = (0, express_1.default)();
const server = new apollo_server_express_1.ApolloServer({ typeDefs, resolvers });
server.start().then(res => {
    server.applyMiddleware({ app });
    app.listen(PORT, () => {
        console.log("listening on port " + PORT);
    });
});
const PORT = process.env.port || 4000;
app.use(body_parser_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, express_fileupload_1.default)());
const whiteList = ["http://localhost:3000", "http://127.0.0.1:300", "http://192.168.100.65:3000", "http://localhost:4000", "*"];
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
app.post("/userInfo", (req, res) => {
    const { hash } = req.body;
    findUser(undefined, hash).then((user) => {
        if (user !== null && user !== undefined) {
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
            newUser(username, password).then(user => {
                fs_1.default.mkdir(`./files/${user._id}`, (err) => {
                    console.log(err);
                });
            });
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
app.post("/setProfile", (req, res) => {
    if (req.files) {
        // const fileStream = fs.createWriteStream()
        const { hash, bio } = req.body;
        const picture = req.files?.profilePicture;
        // const pictureName = picture.name;
        const pictureBuffer = picture.data;
        findUser(undefined, hash).then(user => {
            if (user) {
                const id = user._id;
                const filePath = `./files/${id}/profilePicture.${getExtension(picture.name)}`;
                fs_1.default.writeFile(filePath, pictureBuffer, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                updateUser(user.username, { bio: bio });
                res.send("ok");
            }
        });
        console.log(picture);
    }
});
async function newUser(username, password) {
    const user = new User_1.default({ username: username, password: password });
    await user.save();
    return user;
}
async function updateUser(username, options) {
    const { following, followersCount, password, newUsername, hash, bio } = options;
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
    if (bio !== undefined) {
        user.bio = bio;
    }
    await user.save();
}
async function findUser(username, hash) {
    // console.log(username)
    if (username !== undefined) {
        const user = await User_1.default.findOne({ username: username });
        return user;
    }
    else if (hash !== undefined) {
        const user = await User_1.default.findOne({ hash: hash });
        return user;
    }
}
function getExtension(fileName) {
    const splits = fileName.split(".");
    return splits[splits.length - 1];
}
