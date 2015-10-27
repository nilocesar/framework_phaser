var Phaser = require('Phaser')
  , DraggingSelectionOverlay = null

  , plugins = null
  , selectionPlugin = null
  , groupPanel
  , entityPallete
  , bmd = null

DraggingSelectionOverlay = function (game, parent) {
  Phaser.Plugin.call(this, game, parent)
}

DraggingSelectionOverlay.prototype = Object.create(Phaser.Plugin.prototype)
DraggingSelectionOverlay.prototype.constructor = DraggingSelectionOverlay
DraggingSelectionOverlay.prototype.group = null

DraggingSelectionOverlay.prototype.init = function ( $plugins) {
  plugins = $plugins
  selectionPlugin = plugins.selection
  groupPanel = plugins.groupManager
  entityPallete = plugins.entityPalette

  bmd = this.game.add.graphics(0,0)
  bmd.fixedToCamera = true
}

DraggingSelectionOverlay.prototype.update = function () {
  drawDraggingSelectionOverlay(this.game)
}

function drawDraggingSelectionOverlay (game) {

  bmd.clear()

  var maxXPos = game.width - 246
    , maxYPos = game.height - 95
    , minYPos = 35

  if (!groupPanel.isOpen()) {
    maxXPos = game.width
  }

  if (!entityPallete.isOpen()) {
    maxYPos = game.height
  }

  if (selectionPlugin.isDraggingSelectionBox && !game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {

    var w = game.input.mousePointer.x - selectionPlugin.beginDragBoxPoint.x
      , h = game.input.mousePointer.y - selectionPlugin.beginDragBoxPoint.y
      , xPos = selectionPlugin.beginDragBoxPoint.x < game.input.mousePointer.x ? selectionPlugin.beginDragBoxPoint.x : game.input.mousePointer.x
      , yPos = selectionPlugin.beginDragBoxPoint.y < game.input.mousePointer.y ? selectionPlugin.beginDragBoxPoint.y : game.input.mousePointer.y

    if (w < 0 ) {
      w *= -1
    }

    if (h < 0 ) {
      h *= -1
    }

    if (yPos + h > maxYPos) {
      h -=(yPos + h)-maxYPos
    }

    if (yPos < minYPos) {
      yPos = minYPos
      h -= minYPos-game.input.mousePointer.y
    }

    if (xPos + w > maxXPos) {
      w -= (xPos + w) - maxXPos
    }

    if (xPos > maxXPos) {
      xPos = maxXPos
    }

    // set a fill and line style
    bmd.lineStyle(2, 0xFFFFFF, 1);
    bmd.drawRect(xPos, yPos, w, h);
  }
}

module.exports = DraggingSelectionOverlay
