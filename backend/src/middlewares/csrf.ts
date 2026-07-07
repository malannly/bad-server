import csrf from 'csurf'

// creatinf csrf token
// put token into protected cookie
// checkes the token
export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
    },
})