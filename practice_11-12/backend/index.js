const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { nanoid } = require("nanoid");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3000;
const JWT_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

const ROLES = {
  USER: "user",
  SELLER: "seller",
  ADMIN: "admin",
};

function createUser({ email, first_name, last_name, password, role = ROLES.USER }) {
  return {
    id: nanoid(),
    email,
    first_name,
    last_name,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    blocked: false,
  };
}

let users = [
  createUser({
    email: "admin@gmail.com",
    first_name: "Админ",
    last_name: "Главный",
    password: "admin123",
    role: ROLES.ADMIN,
  }),
  createUser({
    email: "seller@gmail.com",
    first_name: "Продавец",
    last_name: "Листьев",
    password: "seller123",
    role: ROLES.SELLER,
  }),
  createUser({
    email: "user@gmail.com",
    first_name: "Покупатель",
    last_name: "Чашкин",
    password: "user123",
    role: ROLES.USER,
  }),
];

let refreshTokens = [];

let products = [
  {
    id: nanoid(),
    title: "Чёрный чай Ассам",
    category: "Чёрный чай",
    description: "Крепкий насыщенный чай с солодовыми нотами для бодрого утра.",
    price: 390,
  },
  {
    id: nanoid(),
    title: "Сенча премиум",
    category: "Зелёный чай",
    description: "Свежий травянистый вкус и мягкое чистое послевкусие.",
    price: 520,
  },
  {
    id: nanoid(),
    title: "Габа улун",
    category: "Улун",
    description: "Медово-фруктовый аромат и долгое сладкое послевкусие.",
    price: 860,
  },
  {
    id: nanoid(),
    title: "Да Хун Пао",
    category: "Улун",
    description: "Легендарный утёсный чай с жареными нотами и плотным вкусом.",
    price: 990,
  },
  {
    id: nanoid(),
    title: "Шу пуэр",
    category: "Пуэр",
    description: "Глубокий землянистый чай с древесными оттенками и мягким эффектом.",
    price: 740,
  },
];

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    blocked: user.blocked,
  };
}

function removeRefreshTokensForUser(userId) {
  refreshTokens = refreshTokens.filter((item) => item.userId !== userId);
}

function generateTokenPair(user) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  const record = {
    id: nanoid(),
    userId: user.id,
    token: refreshToken,
  };

  refreshTokens.push(record);

  return { accessToken, refreshToken };
}

function getRefreshTokenFromHeaders(req) {
  return (
    req.headers["x-refresh-token"] ||
    req.headers.refresh_token ||
    req.headers.refreshtoken ||
    ""
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((item) => item.id === payload.sub);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.blocked) {
      removeRefreshTokensForUser(user.id);
      return res.status(403).json({ error: "User is blocked" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Practice 9-11 Tea Shop API",
      version: "1.0.0",
      description: "Auth, refresh tokens, product CRUD and RBAC user management.",
    },
    servers: [{ url: `http://localhost:${PORT}`, description: "Local server" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterBody: {
          type: "object",
          required: ["email", "first_name", "last_name", "password"],
          properties: {
            email: { type: "string", example: "tea@mail.com" },
            first_name: { type: "string", example: "Ivan" },
            last_name: { type: "string", example: "Ivanov" },
            password: { type: "string", example: "123456" },
          },
        },
        LoginBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "admin@tea.local" },
            password: { type: "string", example: "admin123" },
          },
        },
        TokenPair: {
          type: "object",
          required: ["accessToken", "refreshToken"],
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        User: {
          type: "object",
          required: ["id", "email", "first_name", "last_name", "role", "blocked"],
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            role: { type: "string", enum: ["user", "seller", "admin"] },
            blocked: { type: "boolean" },
          },
        },
        UserUpdateBody: {
          type: "object",
          properties: {
            email: { type: "string" },
            first_name: { type: "string" },
            last_name: { type: "string" },
            role: { type: "string", enum: ["user", "seller", "admin"] },
            blocked: { type: "boolean" },
          },
        },
        Product: {
          type: "object",
          required: ["id", "title", "category", "description", "price"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            category: { type: "string" },
            description: { type: "string" },
            price: { type: "number" },
          },
        },
        ProductCreateBody: {
          type: "object",
          required: ["title", "category", "description", "price"],
          properties: {
            title: { type: "string", example: "Tie Guan Yin" },
            category: { type: "string", example: "Oolong" },
            description: { type: "string", example: "Floral oolong with creamy finish." },
            price: { type: "number", example: 790 },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Invalid credentials" },
          },
        },
        DeleteMessage: {
          type: "object",
          properties: {
            message: { type: "string", example: "Product deleted" },
          },
        },
      },
    },
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterBody'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  if (users.some((user) => user.email === email)) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const user = {
    id: nanoid(),
    email,
    first_name,
    last_name,
    passwordHash: await bcrypt.hash(password, 10),
    role: ROLES.USER,
    blocked: false,
  };

  users.push(user);
  res.status(201).json(sanitizeUser(user));
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginBody'
 *     responses:
 *       200:
 *         description: Token pair
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenPair'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User is blocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = users.find((item) => item.email === email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (user.blocked) {
    return res.status(403).json({ error: "User is blocked" });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  removeRefreshTokensForUser(user.id);
  res.json(generateTokenPair(user));
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh token pair
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-refresh-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Refresh token from login response
 *     responses:
 *       200:
 *         description: New access and refresh tokens
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenPair'
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User is blocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post("/api/auth/refresh", (req, res) => {
  const refreshToken = getRefreshTokenFromHeaders(req);

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token is required" });
  }

  const tokenRecord = refreshTokens.find((item) => item.token === refreshToken);
  if (!tokenRecord) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((item) => item.id === payload.sub);

    refreshTokens = refreshTokens.filter((item) => item.token !== refreshToken);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.blocked) {
      return res.status(403).json({ error: "User is blocked" });
    }

    return res.json(generateTokenPair(user));
  } catch (error) {
    refreshTokens = refreshTokens.filter((item) => item.token !== refreshToken);
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User is blocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json(sanitizeUser(req.user));
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get("/api/users", authMiddleware, requireRoles(ROLES.ADMIN), (req, res) => {
  res.json(users.map(sanitizeUser));
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get("/api/users/:id", authMiddleware, requireRoles(ROLES.ADMIN), (req, res) => {
  const user = users.find((item) => item.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(sanitizeUser(user));
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateBody'
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.put("/api/users/:id", authMiddleware, requireRoles(ROLES.ADMIN), (req, res) => {
  const user = users.find((item) => item.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { email, first_name, last_name, role, blocked } = req.body;

  if (email !== undefined) {
    const emailTaken = users.some((item) => item.email === email && item.id !== user.id);
    if (emailTaken) {
      return res.status(400).json({ error: "Email already exists" });
    }
    user.email = email;
  }

  if (first_name !== undefined) user.first_name = first_name;
  if (last_name !== undefined) user.last_name = last_name;

  if (role !== undefined) {
    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    user.role = role;
  }

  if (blocked !== undefined) {
    user.blocked = Boolean(blocked);
    if (user.blocked) {
      removeRefreshTokensForUser(user.id);
    }
  }

  res.json(sanitizeUser(user));
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Block user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User blocked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.delete("/api/users/:id", authMiddleware, requireRoles(ROLES.ADMIN), (req, res) => {
  const user = users.find((item) => item.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.blocked = true;
  removeRefreshTokensForUser(user.id);

  res.json(sanitizeUser(user));
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Products list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get(
  "/api/products",
  authMiddleware,
  requireRoles(ROLES.USER, ROLES.SELLER, ROLES.ADMIN),
  (req, res) => {
    res.json(products);
  }
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateBody'
 *     responses:
 *       201:
 *         description: Created product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.post(
  "/api/products",
  authMiddleware,
  requireRoles(ROLES.SELLER, ROLES.ADMIN),
  (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || price === undefined) {
      return res.status(400).json({ error: "All product fields required" });
    }

    const product = {
      id: nanoid(),
      title,
      category,
      description,
      price: Number(price),
    };

    products.push(product);
    res.status(201).json(product);
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by id
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get(
  "/api/products/:id",
  authMiddleware,
  requireRoles(ROLES.USER, ROLES.SELLER, ROLES.ADMIN),
  (req, res) => {
    const product = products.find((item) => item.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreateBody'
 *     responses:
 *       200:
 *         description: Updated product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.put(
  "/api/products/:id",
  authMiddleware,
  requireRoles(ROLES.SELLER, ROLES.ADMIN),
  (req, res) => {
    const product = products.find((item) => item.id === req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const { title, category, description, price } = req.body;

    if (title !== undefined) product.title = title;
    if (category !== undefined) product.category = category;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);

    res.json(product);
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteMessage'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.delete(
  "/api/products/:id",
  authMiddleware,
  requireRoles(ROLES.ADMIN),
  (req, res) => {
    const initialLength = products.length;
    products = products.filter((item) => item.id !== req.params.id);

    if (products.length === initialLength) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  }
);

app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log("Demo accounts:");
  console.log("admin@gmail.com / admin123");
  console.log("seller@gmail.com / seller123");
  console.log("user@gmail.com / user123");
});
