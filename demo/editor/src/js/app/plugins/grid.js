var Phaser = require('Phaser')
  , properties = require('editor-properties')
  , ScreenProperties = require('screen-properties')
  , Grid = null

  , gridGraphics = null
  , selectedEntity = null
  , gridMask = null

Grid = function (game, parent) {
  Phaser.Plugin.call(this, game, parent)
}

Grid.prototype = Object.create(Phaser.Plugin.prototype)
Grid.prototype.constructor = Grid
Grid.prototype.group = null

Grid.prototype.init = function (workspace) {
  gridGraphics = this.game.add.graphics(0,0)

  drawGroupGridSize(this.game)

  workspace.events.gridChanged.add( handleGridChange, this)
  workspace.events.gameLogicSettingChanged.add(this.drawGridMask, this)

  this.drawGridMask()
}

Grid.prototype.drawGridMask = function() {

  if(!gridMask) {
    gridMask = this.game.add.graphics(0,0)
    gridGraphics.mask = gridMask
  }

  var pos = {x:0, y:0}

  pos.x = this.game.x === undefined ? 0 : this.game.x
  pos.y = this.game.y === undefined ? 0 : this.game.y

  gridMask.clear()
  gridMask.beginFill(0xFF3300)
  gridMask.drawRect( pos.x,  pos.y, ScreenProperties.logicWidth, ScreenProperties.logicHeight)
  gridMask.endFill()
}

Grid.prototype.update = function () {
  drawGroupGridSize(this.game)
}

function handleGridChange(entity) {
  selectedEntity = entity
}

function drawGroupGridSize() {
  gridGraphics.clear()
  gridGraphics.lineStyle(.4, 0xFFFFFF, .5);

  var startPos = { x: -properties.grid.offsetX, y: -properties.grid.offsetY }

  while (startPos.x > 0) {
    startPos.x -= properties.grid.x
  }

  while (startPos.y > 0) {
    startPos.y -= properties.grid.y
  }

  for (var i = startPos.x; i < ScreenProperties.logicWidth; i += properties.grid.x) {
    gridGraphics.moveTo(i, startPos.y)
    gridGraphics.lineTo(i,  ScreenProperties.logicHeight)
  }

  for (i = startPos.y; i < ScreenProperties.logicHeight; i += properties.grid.y) {
    gridGraphics.moveTo(startPos.x , i)
    gridGraphics.lineTo(ScreenProperties.logicWidth, i)
  }
}

module.exports = Grid
