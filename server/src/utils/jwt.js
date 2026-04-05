import jwt from 'jsonwebtoken'

// Generate a signed JWT containing the user's id
const signToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// Build and send the standard auth response
const sendAuthResponse = (res, statusCode, user, token) => {
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:       user._id,
      name:     user.name,
      email:    user.email,
      role:     user.role,
      skills:   user.skills,
      cvParsed: user.cvParsed,
      headline: user.headline,
      location: user.location,
    },
  })
}

export { signToken, sendAuthResponse }