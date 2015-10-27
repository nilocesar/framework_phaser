var properties = require('editor-properties')

module.exports = function(game, currentX, currentY) {

  var addButton = function(image, callback, callback2, atlas, hoverFrame, text) {
    var button = game.add.sprite(currentX, currentY, atlas)
      , buttonArguments = arguments

    button.animations.add('idle',[image])
    button.animations.add('hover',[hoverFrame])
    button.animations.play('idle')

    button.fixedToCamera = true
    button.inputEnabled = true
    button.input.useHandCursor = true

    button.events.onInputOver.add(function(button) {
      button.animations.play('hover')
    })

    button.events.onInputOut.add(function(button) {
      button.animations.play('idle')
    })

    button.events.onInputDown.add(function(button) {
      button.animations.play('idle')
    })

    button.events.onInputUp.add(function() {
      // Take any arguments passed after callback and pass them along to it.
      callback.apply(this, Array.prototype.slice.call(buttonArguments, 2))
    }, this)

    if( text ) {
      button.label = game.add.text(0, currentY+1, text, { font: 'bold 14px Arial', fill: 'black', align: 'left' })
      button.label.x = (currentX + button.width/2)-button.label.width/2
      button.label.fixedToCamera = true
    }

    currentX += button.width + properties.buttonPadding
    return button
  }

  return addButton
}
