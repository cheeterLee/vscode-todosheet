import "reflect-metadata"
import express from "express"
import { DataSource } from "typeorm"
import { join } from "path"
import * as dotenv from "dotenv"
import { __prod__ } from "./constants"
import { User } from "./entities/User"
import { Strategy as GitHubStrategy } from "passport-github"
import passport from "passport"
import jwt from 'jsonwebtoken'

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
	app.use(passport.initialize())

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
				cb(null, { accessToken: jwt.sign({ userId: user.id }, "somerandomstring", {
					expiresIn: "1y"
				}) })
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

	app.get("/", (_, res) => {
		res.send("Hello World")
	})
	app.listen(3000, () => {
		console.log("Server started on http://localhost:3000")
	})
}

main()
