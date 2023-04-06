import "reflect-metadata"
import express from "express"
import { DataSource } from "typeorm"
import { join } from "path"
import * as dotenv from "dotenv"
import { __prod__ } from "./constants"
import { User } from "./entities/User"
import { Strategy as GitHubStrategy } from "passport-github"
import passport from "passport"
import jwt from "jsonwebtoken"
import cors from "cors"
import { Todo } from "./entities/Todo"
import { isAuth } from "./isAuth"

const main = async () => {
	const dataSource = new DataSource({
		type: "postgres",
		host: "localhost",
		port: 5432,
		database: "todosheet",
		entities: [join(__dirname, "./entities/*.*")],
		// dropSchema: true,
		logging: !__prod__,
		synchronize: !__prod__,
	})

	await dataSource.initialize()

	dotenv.config()

	const app = express()
	passport.serializeUser((user: any, done) => {
		done(null, user.accessToken)
	})

	app.use(cors({ origin: "*" }))
	app.use(passport.initialize())
	app.use(express.json())

	passport.use(
		new GitHubStrategy(
			{
				clientID: process.env.GITHUB_CLIENT_ID,
				clientSecret: process.env.GITHUB_CLIENT_SECRET,
				callbackURL: "http://localhost:3000/auth/github/callback",
			},
			async (_accessToken, _refreshToken, profile, cb) => {
				let user = await User.findOne({
					where: { githubId: profile.id },
				})
				if (user) {
					user.name = profile.displayName
					await user.save()
				} else {
					user = await User.create({
						name: profile.displayName,
						githubId: profile.id,
					}).save()
				}
				cb(null, {
					accessToken: jwt.sign(
						{ userId: user.id },
						process.env.JWT_SECRET,
						{
							expiresIn: "1y",
						}
					),
				})
			}
		)
	)

	app.get("/auth/github", passport.authenticate("github", { session: false }))

	app.get(
		"/auth/github/callback",
		passport.authenticate("github", { session: false }),
		(req: any, res) => {
			res.redirect(`http://localhost:54321/auth/${req.user.accessToken}`)
		}
	)

	app.get("/todo", isAuth, async (req, res) => {
		const todos = await Todo.find({
			where: { createrId: req.userId },
			order: { id: "DESC" },
		})
		res.send({ todos })
	})

	app.post("/todo", isAuth, async (req, res) => {
		const todo = await Todo.create({
			text: req.body.text,
			createrId: req.userId,
		}).save()
		res.send({ todo })
	})

	app.put("/todo", isAuth, async (req, res) => {
		const todo = await Todo.findOne({
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
		// Bearer 120jdklowqjed021901
		const authHeader = req.headers.authorization
		if (!authHeader) {
			res.send({ user: null })
			return
		}

		const token = authHeader.split(" ")[1]
		if (!token) {
			res.send({ user: null })
			return
		}

		let userId = null

		try {
			const payload: any = jwt.verify(token, process.env.JWT_SECRET)
			userId = payload.userId
		} catch (err) {
			res.send({ user: null })
			return
		}

		if (!userId) {
			res.send({ user: null })
			return
		}

		const user = await User.findOneBy({ id: userId })
		console.log(user)

		res.send({ user })
	})

	app.get("/", (_, res) => {
		res.send("Hello World")
	})
	app.listen(3000, () => {
		console.log("Server started on http://localhost:3000")
	})
}

main()
