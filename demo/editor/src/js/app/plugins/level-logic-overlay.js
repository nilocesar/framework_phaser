var Phaser = require('Phaser')
  , ScreenProperties = require('screen-properties')
  , properties = require('editor-properties')
  , LevelLogicOverlay = null
  , graphic = null

LevelLogicOverlay = function (game, parent) {
  Phaser.Plugin.call(this, game, parent)
}

LevelLogicOverlay.prototype = Object.create(Phaser.Plugin.prototype)
LevelLogicOverlay.prototype.constructor = LevelLogicOverlay
LevelLogicOverlay.prototype.group = null

LevelLogicOverlay.prototype.init = function (workspace) {
  graphic = this.game.add.graphics(0,0)
  this.drawLevelLogicSize(this.game.x, this.game.y)

  workspace.events.gameLogicSettingChanged.add(this.drawLevelLogicSize, this)
}

LevelLogicOverlay.prototype.drawLevelLogicSize = function() {

  var pos = { x: 0, y: 0 }

  pos.x = this.game.x === undefined ? 0 : this.game.x
  pos.y = this.game.y === undefined ? 0 : this.game.y

  graphic.clear()

  if (properties.showGameLogicSize) {
    graphic.lineStyle(2, 0xFFFFFF, .5)
    graphic.drawRect( pos.x,  pos.y, ScreenProperties.logicWidth, ScreenProperties.logicHeight)
  }
}


module.exports = LevelLogicOverlay
