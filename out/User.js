"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    following: {
        type: Number,
        default: 0,
    },
    followers: {
        type: Number,
        default: 0,
    },
    firstLogin: {
        type: Boolean,
        default: true
    }
});
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;