const express = require("express");
const { nanoid } = require("nanoid");
const cors = require("cors");
// Swagger
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API интернет-магазина",
      version: "1.0.0",
      description: "Документация REST API для управления товарами",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Локальный сервер",
      },
    ],
  },
  apis: ["./app.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

let products = [
  {
    id: nanoid(6),
    name: "iPhone 15",
    category: "Смартфоны",
    description: "Современный смартфон Apple",
    price: 99990,
    stock: 12,
    rating: 5,
    url: "https://avatars.mds.yandex.net/i?id=328f980bbf070b7a916e3d51ce26310bf82e2ca6-8273295-images-thumbs&n=13"
  },
  {
    id: nanoid(6),
    name: "Samsung Galaxy S24",
    category: "Смартфоны",
    description: "Флагман Samsung",
    price: 89990,
    stock: 8,
    rating: 4,
    url: "https://basket-14.wbbasket.ru/vol2089/part208914/208914727/images/big/1.webp"
  },
  {
    id: nanoid(6),
    name: "MacBook Air M3",
    category: "Ноутбуки",
    description: "Лёгкий и мощный ноутбук",
    price: 149990,
    stock: 5,
    rating: 5,
    url: "https://avatars.mds.yandex.net/i?id=fa861d8c38c1c2e19f0bbb8292ddf1d4_l-5873744-images-thumbs&n=13"
  },
  {
    id: nanoid(6),
    name: "ASUS ROG",
    category: "Ноутбуки",
    description: "Игровой ноутбук",
    price: 179990,
    stock: 3,
    rating: 4,
    url: "https://avatars.mds.yandex.net/i?id=32af6fa7351279a9bf9d5f61fc6a2e43f55f195b-12505840-images-thumbs&n=13"
  },
  {
    id: nanoid(6),
    name: "AirPods Pro",
    category: "Наушники",
    description: "Беспроводные наушники",
    price: 24990,
    stock: 20,
    rating: 5,
    url: "https://basket-17.wbbasket.ru/vol2672/part267271/267271273/images/big/1.webp"
  },
  {
    id: nanoid(6),
    name: "Sony WH-1000XM5",
    category: "Наушники",
    description: "Шумоподавляющие наушники",
    price: 32990,
    stock: 10,
    rating: 4,
    url: "https://img.mvideo.ru/Pdb/400309914b1.jpg"
  },
  {
    id: nanoid(6),
    name: "iPad Air",
    category: "Планшеты",
    description: "Планшет Apple",
    price: 69990,
    stock: 6,
    rating: 4,
    url: "https://main-cdn.sbermegamarket.ru/big2/hlr-system/-11/449/882/664/251/412/100074266827b1.jpg"
  },
  {
    id: nanoid(6),
    name: "Xiaomi Pad 6",
    category: "Планшеты",
    description: "Доступный планшет",
    price: 39990,
    stock: 15,
    rating: 4,
    url: "https://basket-12.wbbasket.ru/vol1770/part177093/177093338/images/c246x328/1.webp"
  },
  {
    id: nanoid(6),
    name: "PlayStation 5",
    category: "Игровые консоли",
    description: "Игровая приставка Sony",
    price: 59990,
    stock: 7,
    rating: 5,
    url: "https://basket-10.wbbasket.ru/vol1364/part136436/136436256/images/big/1.webp"
  },
  {
    id: nanoid(6),
    name: "Xbox Series X",
    category: "Игровые консоли",
    description: "Игровая приставка Microsoft",
    price: 57990,
    stock: 9,
    rating: 5,
    url: "https://main-cdn.sbermegamarket.ru/big2/hlr-system/-49/435/753/829/146/100052020847b0.jpg"
  }
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID товара
 *         name:
 *           type: string
 *         category:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: number
 *         rating:
 *           type: number
 *         url:
 *           type: string
 *       example:
 *         id: "abc123"
 *         name: "iPhone 15"
 *         category: "Смартфоны"
 *         description: "Современный смартфон Apple"
 *         price: 99990
 *         stock: 12
 *         rating: 5
 *         url: "https://example.com/image.jpg"
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

// Получить все товары
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */

// Получить товар по ID
app.get("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Товар создан
 */

// Создать товар
app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock, rating, url } = req.body;

  const newProduct = {
    id: nanoid(6),
    name,
    category,
    description,
    price: Number(price),
    stock: Number(stock),
    rating: Number(rating),
    url
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновить товар
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Обновленный товар
 *       404:
 *         description: Товар не найден
 */

// Обновить товар
app.patch("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });

  Object.assign(product, req.body);
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар удален
 *       404:
 *         description: Товар не найден
 */

// Удалить товар
app.delete("/api/products/:id", (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});