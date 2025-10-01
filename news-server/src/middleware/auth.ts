import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "";
const ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || "12h";

if (!ADMIN_JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn("[AdminAuth] ADMIN_JWT_SECRET (or JWT_SECRET) is not set. Admin authentication will fail.");
}

const verifyPassword = async (inputPassword: string): Promise<boolean> => {
  if (ADMIN_PASSWORD_HASH) {
    try {
      return await bcrypt.compare(inputPassword, ADMIN_PASSWORD_HASH);
    } catch (error) {
      return false;
    }
  }
  if (ADMIN_PASSWORD) {
    return inputPassword === ADMIN_PASSWORD;
  }
  return false;
};

export const issueAdminToken = (username: string): string => {
  if (!ADMIN_JWT_SECRET) {
    throw new Error("ADMIN_JWT_SECRET is not configured");
  }
  const expiresInValue = ADMIN_JWT_EXPIRES_IN && /^\d+$/.test(ADMIN_JWT_EXPIRES_IN)
    ? Number(ADMIN_JWT_EXPIRES_IN)
    : (ADMIN_JWT_EXPIRES_IN as SignOptions["expiresIn"]);
  const signOptions: SignOptions = { expiresIn: expiresInValue };
  return jwt.sign({ sub: username, role: "admin" }, ADMIN_JWT_SECRET as jwt.Secret, signOptions);
};

export const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as jwt.JwtPayload;
    (req as Request & { admin?: { username: string } }).admin = { username: (decoded.sub as string) || ADMIN_USERNAME };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const handleAdminLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (!ADMIN_USERNAME) {
    return res.status(500).json({ message: "Admin credentials are not configured." });
  }

  if (username !== ADMIN_USERNAME) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const passwordValid = await verifyPassword(password);
  if (!passwordValid) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = issueAdminToken(username);
  return res.json({ token });
};
