/* File: server.js
* Author: Jonah Dubbs-Nadeau
* Description: Contains all of the functionality for serving the content of the site.
* Sources referenced:
* http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/hello-node/hello-node.html
* http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/node-mysql/node-mysql.html
* https://docs.microsoft.com/en-us/sql/connect/node-js/step-3-proof-of-concept-connecting-to-sql-using-node-js?view=sql-server-ver15
* https://expressjs.com/
* https://docs.microsoft.com/en-us/azure/mysql/connect-nodejs
* https://alligator.io/nodejs/how-to-use__dirname/
* https://github.com/typeiii/jquery-csv
*/

var express = require('express');
var handlebars = require('express-handlebars').create({defaultLayout:'layout'});
var bodyParser = require('body-parser');
var path = require('path');

var app = express();
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

var fs = require('fs');
var csv = require('jquery-csv');

var bars;
var beam;
var floor;

app.get('/',function(req,res,next) {
  var context = {};
  res.render('home', context);
});

app.get('/bars', function(req, res) {
  var context = {
    script: "/js/barsApp.js" 
  };
  res.render('app', context);
});

app.post('/bars', function(req, res, next) {
  if (req.body.cat) {
    if (req.body.grip && req.body.bar && req.body.facing) {
      res.send(JSON.stringify(getBarSkills(req.body.cat, req.body.grip, req.body.bar, req.body.facing)));
    } else {
      res.send(JSON.stringify(getBarSkills(req.body.cat)));
    }
  }
});

app.get('/beam', function(req, res) {
  var context = {
    acroDanceSplit: true,
    script: "/js/beamApp.js" 
  };
  res.render('app', context);
});

app.post('/beam', function(req, res, next) {
  if (req.body.cat) {
    res.send(JSON.stringify(getBeamSkills(req.body.cat)));
  }
});

app.get('/floor', function(req, res) {
  var context = {
    acroDanceSplit: true,
    script: "/js/floorApp.js" 
  };
  res.render('app', context);
});

app.post('/floor', function(req, res, next) {
  if (req.body.cat) {
    if (req.body.cat) {
      res.send(JSON.stringify(getFloorSkills(req.body.cat)));
    }
  }
});

app.get('/resources',function(req,res,next) {
  var context = {};
  res.render('resources', context);
});

app.get('/download', function(req, res) {
  var pathToFile = path.join(__dirname, '/resources/code.pdf');
  res.download(pathToFile, function(err) {
    console.log(err);
  });
});

app.use(function(req,res){
  var context = {};
  res.status(404);
  res.render('404', context);
});

app.use(function(err, req, res, next){
  var context = {};
  res.status(500);
  res.render('500', context);
});

app.listen(app.get('port'), function(){
  console.log('Express started on ' + app.get('port') + '; press Ctrl-C to terminate.');

  fs.readFile('./resources/barskills.csv', 'utf8', function(err, data) {
    if (err) {
      console.log("Bars file could not be read");
      throw err;
    }
    bars = csv.toObjects(data, {onParseValue: csv.hooks.castToScalar});
  });

  fs.readFile('./resources/beamskills.csv', 'utf8', function(err, data) {
    if (err) {
      console.log("Beam file could not be read");
      throw err;
    }
    beam = csv.toObjects(data, {onParseValue: csv.hooks.castToScalar});
  });

  fs.readFile('./resources/floorskills.csv', 'utf8', function(err, data) {
    if (err) {
      console.log("Floor file could not be read");
      throw err;
    }
    floor = csv.toObjects(data, {onParseValue: csv.hooks.castToScalar});
  });
});

function getBarSkills(category, grip, bar, facing) {
  var result = [];

  bars.forEach(skill => {
    if (grip && bar && facing) {
      if (grip == "reverse" || grip == "L") {
        if (skill.cat == category && 
            (skill.startGrip == "either" || skill.startGrip == grip || skill.startGrip == "reverse/L") &&
            (skill.beginsOn == "either" || skill.beginsOn == bar) &&
            (skill.beginsFacing == "either" || skill.beginsFacing == facing)) {
          result.push(skill);
        }
      } else {
        if (skill.cat == category && 
            (skill.startGrip == "either" || skill.startGrip == grip) &&
            (skill.beginsOn == "either" || skill.beginsOn == bar) &&
            (skill.beginsFacing == "either" || skill.beginsFacing == facing)) {
          result.push(skill);
        }
      }
    } else {
      if (skill.cat == category) {
        result.push(skill);
      }
    }
  });

  return result;
}

function getBeamSkills(category) {
  var result = [];
  beam.forEach(skill => {
    if (skill.cat == category) {
      result.push(skill);
    }
  });
  return result;
}

function getFloorSkills(category) {
  var result = [];
  floor.forEach(skill => {
    if (skill.cat == category) {
    result.push(skill);
  }
  });
  return result;
}