require("dotenv").config();
const knex = require("knex");
const fs = require("fs");

// module.exports = knex({
//   client: "pg",
//   connection: {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     database: process.env.DB_NAME,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//   },
// });

// use SSL
module.exports = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(process.env.DB_CA_CERT).toString(),
    },
  },
});
