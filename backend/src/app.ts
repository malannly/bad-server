import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

app.use((req, _res, next) => {
    console.log('INCOMING:', req.method, req.url)
    next()
})

app.use(cookieParser())

app.use(serveStatic(path.join(__dirname, 'public')))

app.use(json())

app.use(urlencoded({ extended: true }))

app.use(
    cors({
        origin: process.env.ORIGIN_ALLOW,
        credentials: true,
    })
)

app.options(
    '*',
    cors({
        origin: process.env.ORIGIN_ALLOW,
        credentials: true,
    })
)

app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
