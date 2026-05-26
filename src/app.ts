
import express, { type Application, type Request, type Response } from 'express';
import { userAuthRoute } from './modules/authentication/auth.router';
import { issueRouter } from './modules/issues/issues.router';

const app : Application = express();


// Middleware to parse JSON & Text
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({extended: true}));


app.use("/api/auth/", userAuthRoute)
app.use("/api/issues", issueRouter);


app.post('/', async (req: Request, res: Response) => {
  console.log(req.body)
});


export default app