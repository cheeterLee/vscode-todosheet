import "reflect-metadata"
import express from "express"
import { DataSource } from "typeorm"
import { join } from "path"
import { __prod__ } from "./constants"
import { User } from "./entities/User"

const main = async () => {
	const dataSource = new DataSource({
		type: "postgres",
		host: "localhost",
		port: 5432,
		database: "todosheet",
		entities: [join(__dirname, "./entities/*.*")],
		logging: !__prod__,
		synchronize: !__prod__,
	})

	await dataSource.initialize()

	const user = await User.create({
		name: "John Doe",
	}).save()

    console.log(user)

	const app = express()
	app.get("/", (_, res) => {
		res.send("Hello World")
	})
	app.listen(3000, () => {
		console.log("Server started on http://localhost:3000")
	})
}

main()
