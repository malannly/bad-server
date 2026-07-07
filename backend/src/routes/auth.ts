import { Router } from 'express'
import {
    getCsrfToken,
    getCurrentUser,
    getCurrentUserRoles,
    login,
    logout,
    refreshAccessToken,
    register,
    updateCurrentUser,
} from '../controllers/auth'
import auth from '../middlewares/auth'
import { csrfProtection } from '../middlewares/csrf'

const authRouter = Router()

// генерация токена в куки
authRouter.get('/csrf-token', csrfProtection, getCsrfToken)

authRouter.get('/user', auth, getCurrentUser)
authRouter.get('/user/roles', auth, getCurrentUserRoles)

authRouter.post('/login', login)
authRouter.post('/register', register)
authRouter.patch('/me', auth, updateCurrentUser)

authRouter.get('/token', refreshAccessToken)
authRouter.get('/logout', logout)

export default authRouter