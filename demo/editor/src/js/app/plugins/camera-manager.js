var Phaser = require('Phaser')
  , CameraManager = null
  , workspace = null
  , mouseCamera = null

CameraManager = function (game, parent) {
  Phaser.Plugin.call(this, game, parent)
}

CameraManager.prototype = Object.create(Phaser.Plugin.prototype)
CameraManager.prototype.constructor = CameraManager

CameraManager.prototype.init = function (_workspace) {
  workspace = _workspace

  // Mouse world/camera movement.
  mouseCamera = null
}

CameraManager.prototype.update = function () {
   // Drag the camera using the mouse.
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
    document.body.style.cursor = 'pointer'
    moveCameraByPointer(this.game.input.mousePointer, this.game)
  } else {
    document.body.style.cursor = 'default'
  }
}

CameraManager.prototype.resetCamera = function() {
  this.game.camera.x = 0
  this.game.camera.y = 0
}

// http://www.html5gamedevs.com/topic/2410-drag-the-camera/
// http://jsfiddle.net/YHj24/21/
function moveCameraByPointer(pointer, game) {

  if (!pointer.timeDown) {
    return
  }

  if (pointer.isDown) {
    if (mouseCamera) {
      game.camera.x += (mouseCamera.x - pointer.position.x)
      game.camera.y += (mouseCamera.y - pointer.position.y)
    }
    mouseCamera = pointer.position.clone()
  }

  if (pointer.isUp) {
    mouseCamera = null
  }
}

module.exports = CameraManager
