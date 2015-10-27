var Phaser = require('Phaser')
  , width = Math.max(document.documentElement.clientWidth, window.innerWidth)
  , height = Math.max(document.documentElement.clientHeight, window.innerHeight)
  , game = new Phaser.Game(width, height, Phaser.AUTO, 'game')
  , boot = require('./states/boot.js')
  , preloader = require('./states/preloader.js')
  , editor = require('./states/editor.js');

game.state.add('boot', boot(game))
game.state.add('preloader', preloader(game))
game.state.add('editor', editor(game))

game.state.start('boot')
