var Phaser = require('Phaser')
  , _ = require('lodash')
  , createButtonBuilder = require('../util/button-builder')
  , persistanceService = require('../util/persistance-service')
  , confirmAction = require('../util/modals/confirm-action')
  , instructions = require('../util/modals/instructions')
  , newLevelOverlay = require('../util/modals/new-level')
  , settings = require('../util/modals/settings')
  , showConsoleModal = require('../util/modals/console')
  , lockedFeature = require('../util/modals/locked-feature')
  , editorProperties = require('../properties')

  , UImanager = {}
  , levelNameText = null
  , mousePosText = null
  , plugins = null
  , workspace = null
  , game = null
  , saveButton
  , uiGroup

UImanager = function ($game, parent) {
  Phaser.Plugin.call(this, $game, parent)

  game = $game
}

UImanager.prototype = Object.create(Phaser.Plugin.prototype)
UImanager.prototype.constructor = UImanager
UImanager.prototype.group = null

UImanager.prototype.init = function ($workspace, $plugins) {

  plugins = $plugins
  workspace = $workspace

  this.drawUI()
  addListeners()

  $(window).resize(_.bind(this.drawUI, this))
}

UImanager.prototype.drawUI = function() {

  if(uiGroup) {
    uiGroup.destroy()
  }

  uiGroup = this.game.add.group()

  //draw background
  var bg = this.game.add.tileSprite(0, 0, this.game.width, 35, 'editorAtlas', 'top-bar.png')
  bg.fixedToCamera = true
  uiGroup.add(bg)

  addText(this.game)
  addUIButtons(this.game)
}

UImanager.prototype.update = function() {
  mousePosText.x = this.game.camera.x + this.game.input.mousePointer.x + 20
  mousePosText.y = this.game.camera.y + this.game.input.mousePointer.y
  mousePosText.text = 'x:' + Math.round(this.game.camera.x + this.game.input.mousePointer.x)  + 'px \ny:' + Math.round(this.game.camera.y + this.game.input.mousePointer.y) +'px'

  if( workspace.hasUnsavedChanges() ) {
    saveButton.label.text = 'Save*'
  } else {
    saveButton.label.text = 'Save'
  }
}

function setLevelName (levelName) {
  levelNameText.text = levelName
}

function addUIButtons (game) {
  var buttonBuilder = createButtonBuilder(game, 8, 8)

  uiGroup.add(buttonBuilder('btn-white-small.png', newLevel, workspace, 'editorAtlas', 'btn-white-small-over.png', 'New'))

  saveButton = buttonBuilder('btn-white-small.png', persistanceService.save, workspace, 'editorAtlas', 'btn-white-small-over.png', 'Save')
  uiGroup.add(saveButton)

  uiGroup.add(buttonBuilder('btn-white-small.png', persistanceService.saveAs, workspace, 'editorAtlas', 'btn-white-small-over.png', 'Save As'))
  uiGroup.add(buttonBuilder('btn-white-small.png', persistanceService.loadLevel , null, 'editorAtlas', 'btn-white-small-over.png', 'Load'))
  uiGroup.add(buttonBuilder('btn-white-small.png', confirmAction, clearLevel, 'editorAtlas', 'btn-white-small-over.png', 'Clear'))

  var xPos = game.width-135

  if( xPos < 995) {
    xPos = 995
  }

  buttonBuilder = createButtonBuilder(game, xPos, 3)
  uiGroup.add(buttonBuilder('help.png', showInstructions, null, 'editorAtlas', 'help.png'))

  xPos = game.width-170

  if(xPos < 993) {
    xPos = 993
  }

  buttonBuilder = createButtonBuilder(game, xPos, 3)
  uiGroup.add(buttonBuilder('settings.png', showSettings, null, 'editorAtlas', 'settings.png'))

  xPos = game.width-100

  if(xPos < 1060) {
    xPos = 1060
  }

  //create publish button
  var publishButton = game.add.button(xPos, 3, 'editorAtlas', publish, this, 'publish-over.png', 'publish.png', 'publish.png', 'publish.png')
  publishButton.input.useHandCursor = true
  publishButton.fixedToCamera = true
  uiGroup.add(publishButton)
}

function clearLevel() {
  workspace.clear(true)

  workspace.events.groupsSet.dispatch()
}

function newLevel() {
  if(editorProperties.lockFeatures) {
    lockedFeature()
    return
  }

  newLevelOverlay(workspace, game)
}

function publish() {

  if(editorProperties.lockFeatures) {
    lockedFeature()
    return
  }

  if (!window.EventSource) {
    console.info('Publishing Project...')
    return
  }

  var modal = showConsoleModal()
    , $status = $('.js-modal p.info-display')

  var source = new window.EventSource('publish')
  source.addEventListener('message', function(e) {
    // This dirty regexp removes bash colours and formatting.
    var text = e.data.replace(/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[m|K]/g, '')
    $status.text(text)
  }, false)

  source.addEventListener('open', function() {
    // Connection was opened. Show output modal.
  }, false)

  source.addEventListener('error', function(e) {
    if (e.eventPhase === window.EventSource.CLOSED) {
      console.info('Publish Complete')
      source.close()
      modal.close()
    } else {
      console.error(e)
    }
  }, false)
}

function showSettings() {
  if($('.settings').length <= 0) {
    closeModels()
    settings(workspace, game)
  } else {
    closeModels()
  }
}

function showInstructions() {
  if($('.instructions').length <= 0) {
    closeModels()
    instructions(workspace, game)
  } else {
    closeModels()
  }
}

function closeModels() {
  $('.instructions').remove()
  $('.settings').remove()
}

function addText (game) {

  //add title bg
  var xPos = game.width/2

  if(xPos < 750) {
    xPos = 750
  }

  var bg = game.add.image(xPos, 5, 'editorAtlas', 'title-bg.png')
  bg.x -= bg.width/2
  bg.fixedToCamera = true

  var style = { font: 'bold 16px Arial', fill: 'white', align: 'left' }
  levelNameText = game.add.text(game.width/2, 9, workspace.levelName, style)
  levelNameText.x -= levelNameText.width/2
  levelNameText.fixedToCamera = true
  uiGroup.add(bg)
  uiGroup.add(levelNameText)

  style = { font: '11px Arial', fill: 'white', align: 'left' }
  mousePosText = game.add.text(0,0, '', style)
}

function updateInputPriority() {
  uiGroup.forEach(function(entity) {
    if(entity.input) {
      entity.input.priorityID = ++workspace.priorityID
    }
  }, this)
}

function addListeners () {
  workspace.events.levelNameChanged.add(setLevelName)
  workspace.events.inputPriorityReset.add(updateInputPriority, this)
}

module.exports = UImanager
