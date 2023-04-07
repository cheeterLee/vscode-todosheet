"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const typeorm_1 = require("typeorm");
const path_1 = require("path");
const dotenv = __importStar(require("dotenv"));
const constants_1 = require("./constants");
const User_1 = require("./entities/User");
const passport_github_1 = require("passport-github");
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cors_1 = __importDefault(require("cors"));
const Todo_1 = require("./entities/Todo");
const isAuth_1 = require("./isAuth");
const main = async () => {
    const dataSource = new typeorm_1.DataSource({
        type: "postgres",
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        username: process.env.PGUSERNAME,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        entities: [(0, path_1.join)(__dirname, "./entities/*.*")],
        logging: !constants_1.__prod__,
        synchronize: !constants_1.__prod__,
    });
    await dataSource.initialize();
    dotenv.config();
    const app = (0, express_1.default)();
    passport_1.default.serializeUser((user, done) => {
        done(null, user.accessToken);
    });
    app.use((0, cors_1.default)({ origin: "*" }));
    app.use(passport_1.default.initialize());
    app.use(express_1.default.json());
    passport_1.default.use(new passport_github_1.Strategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://todosheet.up.railway.app/auth/github/callback",
    }, async (_accessToken, _refreshToken, profile, cb) => {
        let user = await User_1.User.findOne({
            where: { githubId: profile.id },
        });
        if (user) {
            user.name = profile.displayName;
            await user.save();
        }
        else {
            user = await User_1.User.create({
                name: profile.displayName,
                githubId: profile.id,
            }).save();
        }
        cb(null, {
            accessToken: jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, {
                expiresIn: "1y",
            }),
        });
    }));
    app.get("/auth/github", passport_1.default.authenticate("github", { session: false }));
    app.get("/auth/github/callback", passport_1.default.authenticate("github", { session: false }), (req, res) => {
        res.redirect(`http://localhost:54321/auth/${req.user.accessToken}`);
    });
    app.get("/todo", isAuth_1.isAuth, async (req, res) => {
        const todos = await Todo_1.Todo.find({
            where: { createrId: req.userId },
            order: { id: "DESC" },
        });
        res.send({ todos });
    });
    app.post("/todo", isAuth_1.isAuth, async (req, res) => {
        const todo = await Todo_1.Todo.create({
            text: req.body.text,
            createrId: req.userId,
        }).save();
        res.send({ todo });
    });
    app.put("/todo", isAuth_1.isAuth, async (req, res) => {
        const todo = await Todo_1.Todo.findOne({
            where: { id: req.body.id },
        });
        if (!todo) {
            res.send({ todo: null });
            return;
        }
        if (todo.createrId !== req.userId) {
            throw new Error("not authorized");
        }
        todo.completed = !todo.completed;
        await todo.save();
        res.send({ todo });
    });
    app.get("/me", async (req, res) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.send({ user: null });
            return;
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            res.send({ user: null });
            return;
        }
        let userId = null;
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            userId = payload.userId;
        }
        catch (err) {
            res.send({ user: null });
            return;
        }
        if (!userId) {
            res.send({ user: null });
            return;
        }
        const user = await User_1.User.findOneBy({ id: userId });
        console.log(user);
        res.send({ user });
    });
    app.get("/", (_, res) => {
        res.send("Hello World");
    });
    app.listen(process.env.PORT, () => {
        console.log("Server started on http://localhost:3000");
    });
};
main();
//# sourceMappingURL=index.js.map