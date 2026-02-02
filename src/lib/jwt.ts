import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-jwt-secret"
);

interface DesktopTokenPayload {
  userId: string;
  companyId: string;
  email: string;
  [key: string]: string;
}

export async function createDesktopToken(payload: DesktopTokenPayload) {
  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .setIssuedAt()
    .sign(JWT_SECRET);

  const refreshToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  return { accessToken, refreshToken };
}

export async function verifyDesktopToken(
  token: string
): Promise<DesktopTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as DesktopTokenPayload;
  } catch {
    return null;
  }
}

export async function refreshDesktopToken(refreshToken: string) {
  const payload = await verifyDesktopToken(refreshToken);
  if (!payload) {
    return null;
  }

  return createDesktopToken({
    userId: payload.userId,
    companyId: payload.companyId,
    email: payload.email,
  });
}
