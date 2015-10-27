var modal = require('modal')
  , settingsTemplate = require('../../../../templates/modals/settings.jade')
  , editorProperties = require('editor-properties')
  , screenProperties = require('screen-properties')

module.exports = function(workspace) {

  var modalOptions =
    { overlayClassName: 'settings'
    , title: 'Settings'
    , content: $(settingsTemplate())
    , buttons: []
    }

  modal(modalOptions)

  $('#gridWidth').blur(function() {
    editorProperties.grid.x = parseInt($('#gridWidth').val())
  })

  $('#gridHeight').blur(function() {
    editorProperties.grid.y = parseInt($('#gridHeight').val())
  })

  $('#gridOffsetX').blur(function() {
    editorProperties.grid.offsetX = parseInt($('#gridOffsetX').val())
  })

  $('#gridOffsetY').blur(function() {
    editorProperties.grid.offsetY = parseInt($('#gridOffsetY').val())
  })

  $('#gameLogic').change(function() {
    editorProperties.showGameLogicSize = !editorProperties.showGameLogicSize
    workspace.events.gameLogicSettingChanged.dispatch()
  })

  $('#level-width').blur(function() {
    screenProperties.logicWidth = parseInt($('#level-width').val())
    workspace.events.gameLogicSettingChanged.dispatch()
  })

  $('#level-height').blur(function() {
    screenProperties.logicHeight = parseInt($('#level-height').val())
    workspace.events.gameLogicSettingChanged.dispatch()
  })

  $('#backgroundColour').change(function() {
      if(parseInt($('#backgroundColour').val()) !== NaN) {
        workspace.backgroundColour =  $('#backgroundColour').val()
        workspace.events.backgroundColourChanged.dispatch()
      }
  })

  $('.accordion').accordion({ heightStyle: 'content' })

  //set current values
  $('#gridWidth').val(editorProperties.grid.x)
  $('#gridHeight').val(editorProperties.grid.y)
  $('#gridOffsetX').val(editorProperties.grid.offsetX)
  $('#gridOffsetY').val(editorProperties.grid.offsetY)
  $('#level-width').val(screenProperties.logicWidth)
  $('#level-height').val(screenProperties.logicHeight)
  $('#backgroundColour').val(workspace.backgroundColour)
}
