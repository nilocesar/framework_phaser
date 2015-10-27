var express = require('express')
  , bodyParser = require('body-parser')
  , app = express()
  , path = require('path')
  , fs = require('fs')
  , levelPath = path.resolve(__dirname + '/../../src/js/game/levels/')
  , spawn = require('win-spawn')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/../../build/index.html'))
})

app.use('/editor', express.static(path.join(__dirname, '/../build/')))

app.get('/editor', function(req, res) {
  res.sendFile(path.join(__dirname, '/../build/index.html'))
})

app.post('/editor/save', function(req, res) {

  var result = JSON.stringify(req.body.levelData)
    , levelName = req.body.levelData.metaData.levelName

  fs.writeFile(path.join(levelPath, levelName + '.json'), result, function(err) {
    if (err) {
      console.error(err)
      res.status(500).json(err)
    } else {
      res.status(200).end()
    }
  })
})

app.get('/editor/publish', function(req, res) {

  //send headers for event-stream connection
  res.set(
    { 'Content-Type': 'text/event-stream'
    , 'Cache-Control': 'no-cache'
    , 'Connection': 'keep-alive'
    }
  )

  var publish = spawn('grunt', ['publish'])

  publish.stdout.on('data', function (data) {
    res.write('data:' + data + '\n');
  })

  publish.stderr.on('data', function (data) {
    res.write('error:' + data + '\n')
  })

  publish.on('exit', function (code) {
    res.end('child process exited with code ' + code)
  })


})

module.exports = app
