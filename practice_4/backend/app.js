const express = require("express");
const { nanoid } = require("nanoid");
const cors = require("cors");

const app = express();
const port = 3000;

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
    rating: 5
  },
  {
    id: nanoid(6),
    name: "Samsung Galaxy S24",
    category: "Смартфоны",
    description: "Флагман Samsung",
    price: 89990,
    stock: 8,
    rating: 4
  },
  {
    id: nanoid(6),
    name: "MacBook Air M3",
    category: "Ноутбуки",
    description: "Лёгкий и мощный ноутбук",
    price: 149990,
    stock: 5,
    rating: 5
  },
  {
    id: nanoid(6),
    name: "ASUS ROG",
    category: "Ноутбуки",
    description: "Игровой ноутбук",
    price: 179990,
    stock: 3,
    rating: 4
  },
  {
    id: nanoid(6),
    name: "AirPods Pro",
    category: "Наушники",
    description: "Беспроводные наушники",
    price: 24990,
    stock: 20,
    rating: 5
  },
  {
    id: nanoid(6),
    name: "Sony WH-1000XM5",
    category: "Наушники",
    description: "Шумоподавляющие наушники",
    price: 32990,
    stock: 10,
    rating: 4
  },
  {
    id: nanoid(6),
    name: "iPad Air",
    category: "Планшеты",
    description: "Планшет Apple",
    price: 69990,
    stock: 6,
    rating: 4
  },
  {
    id: nanoid(6),
    name: "Xiaomi Pad 6",
    category: "Планшеты",
    description: "Доступный планшет",
    price: 39990,
    stock: 15,
    rating: 4
  },
  {
    id: nanoid(6),
    name: "PlayStation 5",
    category: "Игровые консоли",
    description: "Игровая приставка Sony",
    price: 59990,
    stock: 7,
    rating: 5
  },
  {
    id: nanoid(6),
    name: "Xbox Series X",
    category: "Игровые консоли",
    description: "Игровая приставка Microsoft",
    price: 57990,
    stock: 9,
    rating: 5
  }
];

// Получить все товары
app.get("/api/products", (req, res) => {
  res.json(products);
});

// Получить товар по ID
app.get("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

// Создать товар
app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock, rating } = req.body;

  const newProduct = {
    id: nanoid(6),
    name,
    category,
    description,
    price: Number(price),
    stock: Number(stock),
    rating: Number(rating)
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Обновить товар
app.patch("/api/products/:id", (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Not found" });

  Object.assign(product, req.body);
  res.json(product);
});

// Удалить товар
app.delete("/api/products/:id", (req, res) => {
  products = products.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});