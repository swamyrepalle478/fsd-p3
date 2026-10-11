const express = require("express");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3001;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "mySecretKey123",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 60000,
            httpOnly: true
        }
    })
);

const USERNAME = "admin";
const PASSWORD = "1234";

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }

    res.redirect("/login");
}

app.get("/", (req, res) => {
    res.send(`
        <h1>Session Management</h1>
        <a href="/set-session">Set Session</a><br><br>
        <a href="/dashboard">View Dashboard</a><br><br>
        <a href="/destroy-session">Destroy Session</a><br><br>
        <a href="/login">Login</a>
    `);
});

app.get("/set-session", (req, res) => {
    req.session.username = USERNAME;
    req.session.visitCount = (req.session.visitCount || 0) + 1;

    res.send("Session variables set successfully. <a href='/dashboard'>View Dashboard</a>");
});

app.get("/login", (req, res) => {
    res.render("login", { error: null });
});

app.post("/login", (req, res, next) => {
    const { username, password } = req.body;

    if (username !== USERNAME || password !== PASSWORD) {
        return res.status(401).render("login", {
            error: "Invalid username or password"
        });
    }

    req.session.regenerate(err => {
        if (err) {
            return next(err);
        }

        req.session.user = username;
        req.session.username = username;
        req.session.visitCount = 0;

        req.session.save(saveError => {
            if (saveError) {
                return next(saveError);
            }

            res.redirect("/dashboard");
        });
    });
});

app.get("/dashboard", isAuthenticated, (req, res) => {
    req.session.visitCount = (req.session.visitCount || 0) + 1;

    res.send(`
        <h1>Dashboard</h1>
        <h2>Welcome, ${req.session.username}!</h2>
        <p>Session ID: ${req.sessionID}</p>
        <p>Dashboard visits: ${req.session.visitCount}</p>
        <a href="/dashboard">Refresh Dashboard</a><br><br>
        <a href="/logout">Logout</a>
    `);
});

function destroySession(req, res, next, redirectToLogin) {
    req.session.destroy(err => {
        if (err) {
            return next(err);
        }

        res.clearCookie("connect.sid");
        if (redirectToLogin) {
            return res.redirect("/login");
        }

        res.send("Session destroyed successfully. <a href='/'>Home</a>");
    });
}

app.get("/destroy-session", (req, res, next) => {
    destroySession(req, res, next, false);
});

app.get("/logout", (req, res, next) => {
    destroySession(req, res, next, true);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
