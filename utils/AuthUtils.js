import jwt from "jsonwebtoken";

const generateTokens = (userId, role) => {
    const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
        expiresIn: '15m'
    });
    const refreshToken = jwt.sign({ userId, role }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d'
    });
    return { accessToken, refreshToken };
};

// Modified: Only sets the refresh token in the cookie
const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Recommended: true in prod, false in dev
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

export { generateTokens, setRefreshTokenCookie };