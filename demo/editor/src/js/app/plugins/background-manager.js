var Phaser = require('Phaser')
  , BackgroundManager = null
  , workspace = null

BackgroundManager = function (game, parent) {
  Phaser.Plugin.call(this, game, parent)
}

BackgroundManager.prototype = Object.create(Phaser.Plugin.prototype)
BackgroundManager.prototype.constructor = BackgroundManager
BackgroundManager.prototype.group = null

BackgroundManager.prototype.init = function ($workspace) {
 workspace = $workspace
 workspace.events.backgroundColourChanged.add(this.updateBackground, this)
}

BackgroundManager.prototype.updateBackground = function() {
  this.game.stage.backgroundColor = parseInt(workspace.backgroundColour, 16)
}

module.exports = BackgroundManager
