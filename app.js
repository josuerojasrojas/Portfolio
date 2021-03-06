///important resources
//http://www.tothenew.com/blog/connect-to-postgresql-using-javascript/

var express = require('express');
var pg = require('pg'); //postgres
var parser = require('body-parser');
const app = express();

app.use(express.static( "public" )); //access pictures and suchs

app.use(parser.json());
//connect to database
var connectionString = ""
var pgClient = new pg.Client(connectionString);
pgClient.connect();
//pgClient.query("CREATE TABLE IF NOT EXISTS blog(id SERIAL UNIQUE PRIMARY KEY, title varchar(255) NOT NULL, date date NOT NULL default CURRENT_DATE, summary text NOT NULL, body text NOT NULL)")


// set the view engine to ejs
app.set('view engine', 'ejs')
//-----------------------------------------------------------------------------
//pgClient.query("DROP TABLE locations;");
//pgClient.query("CREATE TABLE IF NOT EXISTS locations(id SERIAL UNIQUE PRIMARY KEY, lat double precision, lng double precision)")
//pgClient.query("CREATE TABLE IF NOT EXISTS blog(id SERIAL UNIQUE PRIMARY KEY, title varchar(255) NOT NULL, date date NOT NULL default CURRENT_DATE, summary text NOT NULL, body text NOT NULL)")
//pgClient.query("CREATE TABLE IF NOT EXISTS comment(id SERIAL UNIQUE PRIMARY KEY,date date NOT NULL default CURRENT_DATE, name varchar(255) NOT NULL, email varchar(255) NOT NULL, comment text NOT NULL, postID Integer NOT NULL REFERENCES blog(id))");
//pgClient.query("CREATE TABLE IF NOT EXISTS projects(id SERIAL UNIQUE PRIMARY KEY, title varchar(255) NOT NULL, date date NOT NULL, url varchar(255) NOT NULL, languages varchar(255) NOT NULL, info text NOT NULL)")
//pgClient.query("INSERT INTO projects(title, date, url,languages, info) values($1,$2,$3,$4,$5)",["Migration of Language and Income","2016-05-4","https://github.com/josuerojasrojas/Migration_of_Language_and_Income","Python","This project was for data science course. It tries to show and answer the question ' Is there a relationship between migration vs language vs income?'"])
//pgClient.query("INSERT INTO projects(title, date, url,languages, info) values($1,$2,$3,$4,$5)",["JukeBox","2017-06-07","https://github.com/josuerojasrojas/JukeBox","HTML, JavaScript, and CSS","This project is a Jukebox that shows basic controls not using the default controls. It can play url mp3s and uses the Spotify to get Spotify preview from song links."])
//pgClient.query("INSERT INTO locations(id, lat, lng) values(DEFAULT, $1, $2)",[-31.563910,147.154312]);
//-----------------------------------------------------------------------------
// home page
app.get('/', (req, res) => {
  var query = pgClient.query("SELECT title, url, languages, info FROM projects ORDER BY date DESC");
  query.on("row", function (row, result) {
    result.addRow(row);
  });
  query.on("end", function (result) {
    //return the data to the page
    res.render('home', { data: result.rows, act:"home"})
  });
})
//-----------------------------------------------------------------------------
//visitor map
app.get('/map(:show)?',(req, res) => {
  var query = pgClient.query("SELECT lat, lng FROM locations");
  query.on("row", function (row, result) {
    result.addRow(row);
  });
  query.on("end", function (result) {
    if(!req.params.show) res.render('map',{data: result.rows, act:"map",showR:1});
    else if(req.params.show == "false") res.render('map',{data: result.rows, act:"map",showR:0});
  });

})

//-----------------------------------------------------------------------------
//post locations from visitor map
app.post('/newLocation', (req, res) =>{
  console.log("adding new loc " + req.body.lat);
  pgClient.query("INSERT INTO locations(id, lat, lng) values(DEFAULT, $1, $2)",[req.body.lat,req.body.lng]);
  res.end('{success : "Updated Successfully", "status" : 200}');
})

//-----------------------------------------------------------------------------
//blog home
app.get('/blog',(req, res) =>{
  var query = pgClient.query("SELECT id, title, summary FROM blog ");
  query.on("row", function(row, result){
    result.addRow(row);
  });
  query.on("end",function(result){
    res.render('blog',{data:result.rows,act:"blog"})
  });
})

//-----------------------------------------------------------------------------
// blog post
app.get('/blog/:id', (req, res) => {
  //when getting comments must join tables
  var query = pgClient.query("SELECT id, title, body FROM blog WHERE id=" + req.params.id);
  query.on("row", function(row, result){
    result.addRow(row);
  });
  query.on("end",function(result){
    var commentQuery = pgClient.query("SELECT name, comment from comment WHERE postID="+ req.params.id)
    commentQuery.on("row", function(crow, cresult){
      cresult.addRow(crow);
    })
    commentQuery.on("end", function(cresult){
      if(result.rows.length > 0){
        res.render('post',{data:result.rows[0], comment:cresult.rows, act:"blog"}) //send here all data
      }else res.render('404',{ title: "404", act:""})

    })
  });
})

//-----------------------------------------------------------------------------
//post comments/ send to database *chnange the address to include id so i dont have to send it
app.post('/submitComment',function(req, res){
  //console.log(req.body.nameD);
  pgClient.query("INSERT INTO comment(id, date, name, email, comment, postID) values(DEFAULT, DEFAULT, $1, $2, $3, $4)",[req.body.nameD, req.body.emailD, req.body.commentD, req.body.postID]);
});

//-----------------------------------------------------------------------------
//get the comments of the post (this shouldnt be called anywhere else besides the post comments section anyway will add to check if exist later)
app.get('/blog/:id/comments',function(req, res){
  var query = pgClient.query("SELECT name, comment from comment WHERE postID="+ req.params.id)
  query.on("row", function(row, result){
    result.addRow(row);
  })
  query.on("end", function(result){
    //console.log(cresult.rows);
    res.send(result.rows) //send here all data
  })
})
//-----------------------------------------------------------------------------
//show the newpost page (easy peasy)
app.get('/newpost', function(req, res){
  res.render('newpost',{act:"newpost",title:'New Post'})
})
//-----------------------------------------------------------------------------
app.post('/newpost', function(req, res){
  pgClient.query("INSERT INTO blog(id, title, date, summary, body) values(DEFAULT, $1, DEFAULT, $2, $3)",[req.body.title, req.body.summary, req.body.body]);
  res.end('{success : "Updated Successfully", "status" : 200}');
  //res.render('newpost',{act:"newpost",title:'New Post'})
})
//-----------------------------------------------------------------------------
app.post('/delete/:id', function(req, res){
  pgClient.query("Delete from comment WHERE postID="+req.params.id);
  pgClient.query("Delete from blog WHERE id="+req.params.id);
  res.end('{success : "Updated Successfully", "status" : 200}');
})
//-----------------------------------------------------------------------------
app.get('/*',function(req,res){
  res.render('404',{ title: "404", act:""})
})
//-----------------------------------------------------------------------------
console.log('listening on port 8080')
app.listen(process.env.PORT || 8080)
