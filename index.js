import express from "express";
const app = express();
app.get('/', (req, res) => {
    res.send('Hello');
});
app.listen(10000, '0.0.0.0');
