const express = require("express");
const mysql = require("mysql");
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded());

//routes
app.get("/", async function (req, res) {
    let categories = await getCategories();
    let authors = await getAuthors();
    res.render("index", {"categories": categories, "authors": authors});
});//root

app.get("/quotes", async function (req, res) {
    let rows = await getQuotes(req.query);
    res.render("quotes", {"records": rows});
});//quotes

app.get("/authorInfo", async function (req, res) {
    let rows = await getAuthorInfo(req.query.authorId);
    res.render("quotes", {"authors": rows});
});//authorInfo

app.get("/admin", async function (req, res) {

    let authorList = await getAuthorList();
    //console.log(authorList);
    res.render("admin", {"authorList": authorList});
});//admin

app.get("/addAuthor", function (req, res) {
    res.render("newAuthor");
});//addAuthor

app.get("/admin", function (req, res) {
    res.render("admin");
});//admin

app.post("/addAuthor", async function (req, res) {
    //res.render("newAuthor");
    let rows = await insertAuthor(req.body);
    console.log(rows);
    //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
    let message = "Author WAS NOT added to the database!";
    if (rows.affectedRows > 0) {
        message = "Author successfully added!";
    }
    res.render("newAuthor", {"message": message});
});

app.get("/updateAuthor", async function (req, res) {
    let authorInfo = await getAuthorInfo(req.query.authorId);
    //console.log(authorInfo);
    res.render("updateAuthor", {"authorInfo": authorInfo});
});

app.post("/updateAuthor", async function (req, res) {
    let rows = await updateAuthor(req.body);

    let authorInfo = req.body;
    console.log(rows);
    //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
    let message = "Author WAS NOT updated!";
    if (rows.affectedRows > 0) {
        message = "Author successfully updated!";
    }
    res.render("updateAuthor", {"message": message, "authorInfo": authorInfo});

});

app.get("/deleteAuthor", async function (req, res) {
    let rows = await deleteAuthor(req.query.authorId);
    console.log(rows);
    //res.send("First name: " + req.body.firstName); //When using the POST method, the form info is stored in req.body
    let message = "Author WAS NOT deleted!";
    if (rows.affectedRows > 0) {
        message = "Author successfully deleted!";
    }

    let authorList = await getAuthorList();
    //console.log(authorList);
    res.render("admin", {"authorList": authorList});
});

function getAuthorList() {
    let conn = dbConnection();

    return new Promise(function (resolve, reject) {
        conn.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `SELECT authorId, firstName, lastName 
                        FROM l9_author
                        ORDER BY lastName`;

            conn.query(sql, function (err, rows, fields) {
                if (err) throw err;
                //res.send(rows);
                conn.end();
                resolve(rows);
            });

        });//connect
    });//promise
}

function getAuthorInfo(authorId) {
    let conn = dbConnection();

    return new Promise(function (resolve, reject) {
        conn.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `SELECT * 
                      FROM l9_author
                      WHERE authorId = ?`;

            conn.query(sql, [authorId], function (err, rows, fields) {
                if (err) throw err;
                //res.send(rows);
                conn.end();
                resolve(rows[0]);
            });
        });//connect
    });//promise
}//getAuthorInfo

function getQuotes(query) {
    let keyword = query.keyword;
    let author = query.firstName;
    let name = author.split(' ');

    let conn = dbConnection();

    return new Promise(function (resolve, reject) {
        conn.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");

            let params = [];
            let sql = `SELECT q.quote, a.firstName, a.lastName, q.category, a.authorId FROM l9_quotes q
                      NATURAL JOIN l9_author a
                      WHERE 
                      q.quote LIKE '%${keyword}%'`;

            if (query.category != "Select one") { //user selected a category
                sql += " AND q.category = ?"; //To prevent SQL injection, SQL statement shouldn't have any quotes.
            }
            if (author != "Select one") { //user selected an author
                sql += " AND a.firstName = ?"; //To prevent SQL injection, SQL statement shouldn't have any quotes.
            }
            if (query.sex) { //user selected the authors gender
                sql += " AND a.sex = ?"; //To prevent SQL injection, SQL statement shouldn't have any quotes.
            }
            params.push(query.category);
            params.push(name[0]);
            params.push(query.sex);

            console.log("SQL:", sql);
            console.log(params);

            conn.query(sql, params, function (err, rows, fields) {
                if (err) throw err;
                conn.end();
                resolve(rows);
            });
        });//connect
    });//promise
}//getQuotes

function getCategories() {
    let conn = dbConnection();

    return new Promise(function (resolve, reject) {
        conn.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `SELECT DISTINCT category 
                      FROM l9_quotes
                      ORDER BY category`;

            conn.query(sql, function (err, rows, fields) {
                if (err) throw err;
                //res.send(rows);
                conn.end();
                resolve(rows);
            });
        });//connect
    });//promise
}//getCategories

function getAuthors() {
    let conn = dbConnection();

    return new Promise(function (resolve, reject) {
        conn.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `SELECT DISTINCT firstName, lastName 
                      FROM l9_author
                      ORDER BY firstName`;

            conn.query(sql, function (err, rows, fields) {
                if (err) throw err;
                //res.send(rows);
                conn.end();
                resolve(rows);
            });
        });//connect
    });//promise
}//getCategories

function insertAuthor(body) {
    let conn = dbConnection();

    return new Promise(function (resolve, reject) {
        conn.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `INSERT INTO l9_author
                        (firstName, lastName, sex)
                         VALUES (?,?,?)`;

            let params = [body.firstName, body.lastName, body.gender];

            conn.query(sql, params, function (err, rows, fields) {
                if (err) throw err;
                //res.send(rows);
                conn.end();
                resolve(rows);
            });

        });//connect
    });//promise
}

function updateAuthor(body) {
    let conn = dbConnection();

    return new Promise(function (resolve, reject) {
        conn.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `UPDATE l9_author
                      SET firstName = ?, 
                          lastName  = ?, 
                                sex = ?
                     WHERE authorId = ?`;

            let params = [body.firstName, body.lastName, body.gender, body.authorId];

            console.log(sql);

            conn.query(sql, params, function (err, rows, fields) {
                if (err) throw err;
                //res.send(rows);
                conn.end();
                resolve(rows);
            });

        });//connect
    });//promise
}

function deleteAuthor(authorId) {

    let conn = dbConnection();

    return new Promise(function (resolve, reject) {
        conn.connect(function (err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `DELETE FROM l9_author
                      WHERE authorId = ?`;

            conn.query(sql, [authorId], function (err, rows, fields) {
                if (err) throw err;
                //res.send(rows);
                conn.end();
                resolve(rows);
            });

        });//connect
    });//promise
}

app.get("/dbTest", function (req, res) {
    let conn = dbConnection();

    conn.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");

        let sql = "SELECT * FROM l9_author WHERE sex = 'F'";

        conn.query(sql, function (err, rows, fields) {
            if (err) throw err;
            conn.end();
            res.send(rows);
        });
    });//connect
});//dbTest

function dbConnection() {
    let conn = mysql.createConnection({
        host: "z1ntn1zv0f1qbh8u.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
        user: "ioy4onmqv1weylss",
        password: "asejam6131qtn63u",
        database: "zqsk0u3fvjp9025s"
    });//createConnection
    return conn;
}

// starting server
app.listen(process.env.PORT || 3000, process.env.IP, function () {
    console.log("Express server is running...");
});