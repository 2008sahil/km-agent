require('./instruement.js')
const express = require('express');
const bodyParser = require('body-parser');
const { updateConfig } = require('./configHandler');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

app.post('/config/update', async (req, res) => {
    try {
        // console.log(req.body);
        const result = await updateConfig(req.body);
        res.status(200).json({ message: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get("/get",(req,res)=>{
    res.send("status code ok");
})

app.listen(PORT, () => {
    console.log(`KloudMate Agent listening on port ${PORT}`);
});
