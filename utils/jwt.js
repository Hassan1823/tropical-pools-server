import { config } from "dotenv";
config();

export const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "1200",
  10
);
export const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// options for cookies
export const accessTokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 1000),
  maxAge: accessTokenExpire * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const refreshTokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 1000),
  maxAge: refreshTokenExpire * 1000,
  httpOnly: true,
  sameSite: "lax",
};

export const sendToken = (user, statusCode, res) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  //   only set secure true in production mode
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  // console.log("access token");
  // console.log(res.cookie("access_token"));
  // console.log("refresh token");
  // console.log(res.cookie("refresh_token"));

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
