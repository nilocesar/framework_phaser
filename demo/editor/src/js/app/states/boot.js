var Stats = require('Stats')
  , properties = require('editor-properties')

module.exports = function(game) {

  var boot = {}

  function addStats() {
    var stats = new Stats()

    stats.setMode(0)

    stats.domElement.style.position = 'absolute'
    stats.domElement.style.right = '0px'
    stats.domElement.style.top = '0px'

    document.body.appendChild(stats.domElement)

    setInterval(function () {
      stats.begin()
      stats.end()
    }, 1000 / 60)
  }

  boot.create = function () {

    game.scale.pageAlignHorizontally = true
    game.scale.pageAlignVertically = true
    game.scale.refresh()

    if (properties.showStats) {
      addStats()
    }

    game.state.start('preloader')
  }

  return boot
}
