import "dotenv/config";
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
// used for storing express session ids in the postgres database



import { corsConfig } from "./config/corsConfig.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { morganConfig } from "./config/morgan.js";
import { pool } from "./config/db.js";
import { authRouter } from "./routes/authRoutes.js";
import productRouter from "./routes/productRoutes.js";
import recurringPlanRouter from "./routes/recurringPlan.js";
import productPlanPricesRouter from "./routes/productPlanPrices.js";
import attributeRouter from "./routes/attributeRoutes.js";
import taxRouter from "./routes/taxRoutes.js";
import discountRouter from "./routes/discountRoutes.js";

const app = express();

const expressSessionSecret = process.env.EXPRESS_SESSION_SECRET_KEY;

if (!expressSessionSecret) {
    throw new Error("Missing EXPRESS_SESSION_SECRET_KEY in environment variables");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morganConfig);
app.use(corsConfig);

app.use(express.urlencoded({extended:true}));

// “Hey connect-pg-simple, here is express-session.
// Please give me a Postgres-compatible session store.”
const PgStore = pgSession(session);


// need to understand this 

app.use(
  session({
    store: new PgStore({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15,
    }),
    secret: expressSessionSecret,
    resave: false,                 
    saveUninitialized: false,
    rolling: false,                //from the moment of login 4 hours are counted 
    cookie: {
      httpOnly: true,
      secure: false,               
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 4,  // 4 hours
    },
  })
);


const PORT = process.env.PORT || 3000;


app.use("/api/auth",authRouter);
app.use("/api/product",productRouter);
app.use("/api/recurringPlan",recurringPlanRouter);
app.use("/api/productPlanPrices",productPlanPricesRouter);
app.use("/api/attributes",attributeRouter);
app.use("/api/taxes",taxRouter);
app.use("/api/discounts",discountRouter);
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
