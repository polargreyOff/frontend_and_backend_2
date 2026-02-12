const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

let goods = [
    {
        id: 1,
        name: "Чай Габа",
        description: "Описание товара",
        price: 1000

    },
    {
        id: 2,
        name: "Чай Пуэр",
        description: "Описание товара",
        price: 1200

    }
]

// Маршруты
app.get('/', (req, res) => {
    res.send('Главная страница');
});

app.get("/goods", (req, res) => {
    res.send(goods);
})

app.get("/goods/:id", (req,res) => {
    const id = req.params.id;
    const item = goods.find( item => item.id == id);
    console.log(item)
    res.send(item);
})

app.post("/goods", (req,res) => {
    const {name, description, price} = req.body;
    const newGood = {
        id: Date.now(),
        name,
        description,
        price
    }
    goods.push(newGood);
    res.status(201).json(newGood);
})

app.patch("/goods/:id", (req, res)=> {
    const id = req.params.id;
    const {name, description, price} = req.body;
    const item = goods.find(item => item.id == id);
    if (name != undefined) item.name = name;
    if (description != undefined) item.description = description;
    if (price != undefined) item.price = price;

    res.json(item);
})

app.delete("/goods/:id", (req, res) => {
    const id = req.params.id;
    goods = goods.filter(item => item.id != id);
    res.send("ok");
})

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});