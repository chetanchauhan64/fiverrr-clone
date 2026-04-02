import { Prisma, prisma } from "../utils/prisma.js";
import { genSalt, hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { renameSync } from "fs";

const generatePassword = async (password) => {
  const salt = await genSalt();
  return await hash(password, salt);
};

const maxAge = 3 * 24 * 60 * 60;
const createToken = (email, userId) => {
  // @ts-ignore
  return jwt.sign({ email, userId }, process.env.JWT_KEY, {
    expiresIn: maxAge,
  });
};

export const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (email && password) {
      const user = await prisma.user.create({
        data: {
          email,
          password: await generatePassword(password),
        },
      });
      return res.status(201).json({
        user: {
          id: user?.id,
          email: user?.email,
          role: user?.role,
          status: user?.status,
        },
        jwt: createToken(email, user.id),
      });
    } else {
      return res.status(400).send("Email and Password Required");
    }
  } catch (err) {
    console.log(err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(400).send("Email Already Registered");
      }
    } else {
      return res.status(500).send("Internal Server Error");
    }
    throw err;
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (email && password) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email },
            { username: email }
          ]
        },
      });
      if (!user) {
        return res.status(404).send("User not found");
      }

      const auth = await compare(password, user.password);
      if (!auth) {
        return res.status(400).send("Invalid Password");
      }

      const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      try {
        await prisma.loginLog.create({
          data: {
            userId: user.id,
            email: user.email,
            ipAddress: typeof ipAddress === "string" ? ipAddress : JSON.stringify(ipAddress),
          },
        });
      } catch (logError) {
        console.error("Login logging failed:", logError.message);
      }

      return res.status(200).json({
        user: {
          id: user?.id,
          email: user?.email,
          role: user?.role,
          status: user?.status,
        },
        jwt: createToken(email, user.id),
      });
    } else {
      return res.status(400).send("Email and Password Required");
    }
  } catch (err) {
    return res.status(500).send("Internal Server Error");
  }
};

export const getUserInfo = async (req, res, next) => {
  try {
    if (req?.userId) {
        const user = await prisma.user.findUnique({
        where: {
          id: parseInt(req.userId),
        },
      });
      return res.status(200).json({
        user: {
          id: user?.id,
          email: user?.email,
          image: user?.profileImage,
          username: user?.username,
          fullName: user?.fullName,
          description: user?.description,
          isProfileSet: user?.isProfileInfoSet,
          role: user?.role,
          status: user?.status,
        },
      });
    }
  } catch (err) {
    res.status(500).send("Internal Server Occurred");
  }
};

export const setUserInfo = async (req, res, next) => {
  try {
    if (req?.userId) {
      console.log("Setting user info for ID:", req.userId);
      const { userName, fullName, description } = req.body;
      console.log("Received data:", { userName, fullName, description });
      
      if (userName && fullName && description) {
        const userNameValid = await prisma.user.findUnique({
          where: { username: userName },
        });
        if (userNameValid && userNameValid.id !== parseInt(req.userId)) {
          console.log("Username taken:", userName);
          return res.status(200).json({ userNameError: true });
        }
        await prisma.user.update({
          where: { id: parseInt(req.userId) },
          data: {
            username: userName,
            fullName,
            description,
            isProfileInfoSet: true,
          },
        });
        return res.status(200).send("Profile data updated successfully.");
      } else {
        const missing = [];
        if (!userName) missing.push("userName");
        if (!fullName) missing.push("fullName");
        if (!description) missing.push("description");
        console.log("Missing fields:", missing);
        return res
          .status(400)
          .send(`Missing fields: ${missing.join(", ")}`);
      }
    }
    return res.status(401).send("Unauthorized");
  } catch (err) {
    console.error("Error in setUserInfo:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return res.status(400).json({ userNameError: true });
      }
    } else {
      return res.status(500).send("Internal Server Error");
    }
    throw err;
  }
};

export const setUserImage = async (req, res, next) => {
  try {
    if (req.file) {
      if (req?.userId) {
        const date = Date.now();
        let fileName = "uploads/profiles/" + date + req.file.originalname;
        renameSync(req.file.path, fileName);
    
        await prisma.user.update({
          where: { id: parseInt(req.userId) },
          data: { profileImage: fileName },
        });
        return res.status(200).json({ img: fileName });
      }
      return res.status(400).send("Cookie Error.");
    }
    return res.status(400).send("Image not included.");
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Occurred");
  }
};

export const socialLogin = async (req, res, next) => {
  try {
    const { email, name, profileImage } = req.body;
    
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        const newUser = await prisma.user.create({
          data: {
            email,
            username: name.toLowerCase().split(" ").join(""),
            fullName: name,
            profileImage,
            isProfileInfoSet: true,
          },
        });
        const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        try {
          await prisma.loginLog.create({
            data: {
              userId: newUser.id,
              email: newUser.email,
              ipAddress: typeof ipAddress === "string" ? ipAddress : JSON.stringify(ipAddress),
            },
          });
        } catch (logError) {
          console.error("Social login logging failed:", logError.message);
        }

        return res.status(201).json({
          user: {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
          },
          jwt: createToken(email, newUser.id),
        });
      } else {
        const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        try {
          await prisma.loginLog.create({
            data: {
              userId: user.id,
              email: user.email,
              ipAddress: typeof ipAddress === "string" ? ipAddress : JSON.stringify(ipAddress),
            },
          });
        } catch (logError) {
          console.error("Social login logging failed:", logError.message);
        }

        return res.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
          },
          jwt: createToken(email, user.id),
        });
      }
    } else {
      return res.status(400).send("Email Required");
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};