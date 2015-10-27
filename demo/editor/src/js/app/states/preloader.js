var levelParser = require('../../../../../src/js/lib/level-parser')

module.exports = function (game) {

  var preloader = {}

  preloader.preload = function () {

    var text = 'loading'
      , style = { font: '65px Arial', fill: 'white', align: 'center' }

    game.add.text(game.world.centerX - 130, game.world.centerY, text, style)
    game.load.atlasJSONHash('editorAtlas', 'images/editor-atlas.png#grunt-cache-bust', 'images/editor-atlas.json#grunt-cache-bust')

    levelParser.loadAssets(this.game)
  }

  preloader.create = function () {
    game.state.start('editor')
  }

  return preloader
}
