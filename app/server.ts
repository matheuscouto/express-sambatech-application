import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app: express.Application = express();

const port: number = 3000;

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors());

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
});