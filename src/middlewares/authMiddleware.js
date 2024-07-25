import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Assuming the token is sent in the Authorization header as 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Attach the user payload to the request object

    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

export { authenticateToken };
