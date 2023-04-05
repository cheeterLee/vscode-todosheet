import express from "express"

const main = async () => {
	const app = express()
	app.get("/", (_, res) => {
		res.send("Hello World")
	})
	app.listen(3000, () => {
		console.log("Server started on http://localhost:3000")
	})
}

main()
