import axios from "axios";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "./jwt.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const API_URL = process.env.API_URL || "http://localhost:5000";

export function oauthRedirectWithToken(token) {
  return `${CLIENT_URL}/auth/callback?token=${encodeURIComponent(token)}`;
}

async function findOrCreateOAuthUser({ email, name, googleId, linkedinId, avatar }) {
  const normalizedEmail = email.toLowerCase().trim();
  let user =
    (googleId && (await User.findOne({ googleId }))) ||
    (linkedinId && (await User.findOne({ linkedinId }))) ||
    (await User.findOne({ email: normalizedEmail }));

  if (user) {
    if (googleId && !user.googleId) user.googleId = googleId;
    if (linkedinId && !user.linkedinId) user.linkedinId = linkedinId;
    if (avatar && !user.avatar) user.avatar = avatar;
    if (name && !user.name) user.name = name;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    return user;
  }

  const randomPassword = await bcrypt.hash(
    `oauth-${Date.now()}-${Math.random().toString(36)}`,
    12,
  );

  user = await User.create({
    name: name || normalizedEmail.split("@")[0],
    email: normalizedEmail,
    password: randomPassword,
    googleId: googleId || undefined,
    linkedinId: linkedinId || undefined,
    avatar: avatar || "",
    authProvider: googleId ? "google" : "linkedin",
  });

  return user;
}

export async function handleGoogleCallback(code) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not configured on the server.");
  }

  const redirectUri = `${API_URL}/api/auth/google/callback`;

  const { data: tokens } = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  const { data: profile } = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );

  if (!profile.email) {
    throw new Error("Google did not return an email address.");
  }

  const user = await findOrCreateOAuthUser({
    email: profile.email,
    name: profile.name,
    googleId: profile.sub,
    avatar: profile.picture,
  });

  return signToken(user._id);
}

export async function handleLinkedInCallback(code) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn OAuth is not configured on the server.");
  }

  const redirectUri = `${API_URL}/api/auth/linkedin/callback`;

  const { data: tokens } = await axios.post(
    "https://www.linkedin.com/oauth/v2/accessToken",
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  const { data: profile } = await axios.get(
    "https://api.linkedin.com/v2/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );

  const email = profile.email;
  if (!email) {
    throw new Error("LinkedIn did not return an email. Ensure the email scope is enabled.");
  }

  const user = await findOrCreateOAuthUser({
    email,
    name: profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim(),
    linkedinId: profile.sub,
    avatar: profile.picture,
  });

  return signToken(user._id);
}

export function getGoogleAuthUrl() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  const redirectUri = encodeURIComponent(`${API_URL}/api/auth/google/callback`);
  const scope = encodeURIComponent("openid email profile");
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=online&prompt=select_account`;
}

export function getLinkedInAuthUrl() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) return null;
  const redirectUri = encodeURIComponent(`${API_URL}/api/auth/linkedin/callback`);
  const scope = encodeURIComponent("openid profile email");
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
}
