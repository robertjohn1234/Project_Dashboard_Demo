// Portfolio demo server: the same dashboard, but with made-up sample data (see demo-data.js).
const express = require("express");
const path = require("path");
const demo = require("./demo-data");

const app = express();
const PORT = process.env.PORT || 3000;

app.use("/content", express.static(path.join(__dirname, "public", "content"), { maxAge: "1h" }));
app.use("/vendor", express.static(path.join(__dirname, "node_modules", "chart.js", "dist")));

// Clean addresses: /cable-status.html redirects to /cable-status
app.use((req, res, next) => {
  if (req.method === "GET" && /\.html$/i.test(req.path)) {
    const clean = req.path.replace(/\/index\.html$/i, "/").replace(/\.html$/i, "");
    return res.redirect(301, (clean || "/") + req.url.slice(req.path.length));
  }
  next();
});
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

app.get("/health", (req, res) => res.status(200).send("Express is healthy"));

const send = fn => (req, res) => res.set("Cache-Control", "no-cache").json(fn());
app.get("/api/data", send(demo.cableData));
app.get("/api/scurve", send(demo.scurveData));
app.get("/api/daily", send(demo.dailyData));
app.get("/api/daily-history", send(demo.dailyHistory));
app.get("/api/categories", send(demo.categoryData));
app.get("/api/category-history", send(demo.categoryHistory));
app.get("/api/bulletin", send(() => [{
  name: "Announcements",
  slides: [
    { name: "Safety First", src: "/images/demo/safety-first.svg" },
    { name: "Welcome, New Members", src: "/images/demo/welcome.svg" },
    { name: "Milestone Reached", src: "/images/demo/milestone.svg" }
  ]
}]));

app.listen(PORT, () => console.log("Demo dashboard running on port " + PORT));
