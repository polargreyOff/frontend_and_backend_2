const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(express.json());

const PORT = 3000;
const JWT_SECRET = "access_secret";
const ACCESS_EXPIRES_IN = "15m";

const cors = require("cors");
app.use(cors({ origin: "http://localhost:5173" }));

let users = [];

let products = [
  {
    id: nanoid(),
    title: "Wireless Mouse",
    category: "Electronics",
    description: "Ergonomic wireless mouse with 2.4GHz receiver",
    price: 1299,
  },
  {
    id: nanoid(),
    title: "Mechanical Keyboard",
    category: "Electronics",
    description: "RGB mechanical keyboard with blue switches",
    price: 5490,
  },
  {
    id: nanoid(),
    title: "Notebook A5",
    category: "Stationery",
    description: "A5 notebook, 120 pages, dotted paper",
    price: 249,
  },
  {
    id: nanoid(),
    title: "Reusable Water Bottle 1L",
    category: "Home",
    description: "BPA-free bottle, leak-proof cap",
    price: 890,
  },
];

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "JWT Auth + Products API",
      version: "1.0.0",
      description: "API with bcrypt auth + JWT + protected product routes",
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: "Local server" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, email, iat, exp }
    next();
  } catch (e) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         id: { type: string, example: "V1StGXR8_Z5jdHi6B-myT" }
 *         email: { type: string, example: "test@mail.com" }
 *         first_name: { type: string, example: "Ivan" }
 *         last_name: { type: string, example: "Ivanov" }
 *         passwordHash:
 *           type: string
 *           example: "$2b$10$Q9mJ3mVf0x1v...."
 *     UserMe:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         email: { type: string }
 *         first_name: { type: string }
 *         last_name: { type: string }
 *         passwordHash:
 *           type: string
 *           example: "$2b$10$Q9mJ3mVf0x1v...."
 *     LoginBody:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, example: "test@mail.com" }
 *         password: { type: string, example: "123456" }
 *     Product:
 *       type: object
 *       properties:
 *         id: { type: string, example: "V1StGXR8_Z5jdHi6B-myT" }
 *         title: { type: string, example: "Wireless Mouse" }
 *         category: { type: string, example: "Electronics" }
 *         description: { type: string, example: "Ergonomic wireless mouse..." }
 *         price: { type: number, example: 1299 }
 *     ProductCreateBody:
 *       type: object
 *       required: [title, category, description, price]
 *       properties:
 *         title: { type: string, example: "USB-C Cable" }
 *         category: { type: string, example: "Electronics" }
 *         description: { type: string, example: "1m USB-C to USB-C cable" }
 *         price: { type: number, example: 399 }
 */

/** =======================
 *  Auth routes
 *  ======================= */
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RegisterBody' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RegisterResponse' }
 *       400:
 *         description: Validation error
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  const exists = users.some((u) => u.email === email);
  if (exists) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: nanoid(),
    email,
    first_name,
    last_name,
    passwordHash,
  };

  users.push(user);

  res.status(201).json({
  id: user.id,
  email: user.email,
  first_name: user.first_name,
  last_name: user.last_name,
  passwordHash: user.passwordHash
});
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему (выдача JWT)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginBody' }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Invalid credentials
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  res.json({ accessToken });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserMe' }
 *       401:
 *         description: Unauthorized
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find((u) => u.id === userId);

  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    passwordHash: user.passwordHash
  });
});

/** =======================
 *  Products routes
 *  ======================= */
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Product' }
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductCreateBody' }
 *     responses:
 *       201:
 *         description: Created
 */
app.post("/api/products", (req, res) => {
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
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по id (защищено)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар (защищено)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               category: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 */
app.put("/api/products/:id", authMiddleware, (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const { title, category, description, price } = req.body;

  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (защищено)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 */
app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const before = products.length;
  products = products.filter((p) => p.id !== req.params.id);

  if (products.length === before) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json({ message: "Product deleted" });
});


app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}`);
  console.log(`Swagger UI:     http://localhost:${PORT}/api-docs`);
});