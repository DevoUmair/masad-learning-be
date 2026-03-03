import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateTokens, setRefreshTokenCookie } from '../utils/AuthUtils.js';

export const register = async (req, res) => {
    try {
        const { name, firstName, lastName, phone, role, instructorProfile, email, password } = req.body;

        if (!email || !password || (!name && (!firstName || !lastName))) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name || `${firstName} ${lastName}`,
            firstName: firstName || name?.split(' ')[0] || '',
            lastName: lastName || name?.split(' ').slice(1).join(' ') || '',
            phone,
            email,
            password: hashedPassword,
            role: role || 'student',
            instructorProfile: role === 'instructor' ? instructorProfile : undefined
        });

        const { accessToken, refreshToken } = generateTokens(user._id, user.role);

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        setRefreshTokenCookie(res, refreshToken);

        // Modified: Send accessToken to the client in the JSON body
        res.status(201).json({
            message: "User registered successfully",
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const { accessToken, refreshToken } = generateTokens(user._id, user.role);

        // Save refresh token to database
        user.refreshToken = refreshToken;
        await user.save();

        setRefreshTokenCookie(res, refreshToken);

        // Modified: Send accessToken to the client in the JSON body
        res.status(200).json({
            message: "Login successful",
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const user = await User.findOne({ refreshToken });
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
        }

        // Modified: Only clear the refreshToken cookie, as accessToken is no longer a cookie
        res.clearCookie('refreshToken');
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "No refresh token provided" });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);

        // Rotate refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        setRefreshTokenCookie(res, newRefreshToken);

        // Modified: Send the new accessToken back so the frontend can update its state
        res.status(200).json({
            message: "Token refreshed successfully",
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Refresh Token Error:", error);
        res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};

export const getMe = async (req, res) => {
    try {
        res.status(200).json({
            user: {
                _id: req.user._id,
                name: req.user.name,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error("Get Me Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};