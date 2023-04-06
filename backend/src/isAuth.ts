import { RequestHandler } from "express";
import jwt from 'jsonwebtoken'

export const isAuth: RequestHandler<{}, any, any, {}> = (req, _res, next) => {
    const authHeader = req.headers.authorization
		if (!authHeader) {
			throw new Error(`Not authenticated`)
		}

		const token = authHeader.split(" ")[1]
		if (!token) {
			throw new Error(`Not authenticated`)
		}

		try {
			const payload: any = jwt.verify(token, process.env.JWT_SECRET)
            req.userId = payload.userId
            next()
            return
        } catch {}

		throw new Error(`Not authenticated`)
}