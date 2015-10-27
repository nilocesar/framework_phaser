var Phaser = require('Phaser')
  , properties = require('properties')

//  Here is a custom game object
var CollisionArea = function ( game, x, y, rect , isLE, container, collisionAreaOverlayLayer) {
  Phaser.Sprite.call(this, game, x, y, '')
  this.x = rect.x
  this.y = rect.y
  this.width = rect.width
  this.height = rect.height

  if (properties.debugPlatforms || isLE) {
    this.collisionGraphics = new Phaser.Graphics(this.game,0,0)
    collisionAreaOverlayLayer.add(this.collisionGraphics)
    this.collisionGraphics.beginFill(0xFF0000, .6)
    this.collisionGraphics.drawRect(0, 0, this.width, this.height)
    this.collisionGraphics.endFill()
    this.collisionGraphics.levelEntityId = 'collision-graphic'
  }

  this.game.physics.arcade.enable(this)
  this.body.immovable = true
  this.inputEnabled = true
  this.levelEntityId = 'collision-area'
}

CollisionArea.prototype = Object.create(Phaser.Sprite.prototype)
CollisionArea.prototype.constructor = CollisionArea

CollisionArea.prototype.update = function() {
  if (this.collisionGraphics) {
    this.collisionGraphics.x = this.x
    this.collisionGraphics.y = this.y
  }
}

CollisionArea.prototype.toggleVisibility = function() {
  this.collisionGraphics.visible = !this.collisionGraphics.visible
}

module.exports = CollisionArea
