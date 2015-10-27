var Phaser = require('Phaser')
  , CollisionRectManager = null
  , workspace = null

CollisionRectManager = function (game, parent) {
  Phaser.Plugin.call(this, game, parent)
}

CollisionRectManager.prototype = Object.create(Phaser.Plugin.prototype)
CollisionRectManager.prototype.constructor = CollisionRectManager
CollisionRectManager.prototype.group = null

CollisionRectManager.prototype.init = function ($workspace) {
  workspace = $workspace
  workspace.events.collisionAreaCreated.add( addCollisionArea, this )
}

function addCollisionArea() {
  // workspace.collisionRects.push(  )
}

module.exports = CollisionRectManager
