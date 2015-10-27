var _ = require('lodash')
  , Phaser = require('Phaser')
  , EntityPallet = require('../plugins/entity-palette')
  , setupEntityBuilder = require('../util/entity-builder')
  , moduleManager = require('../util/module-manager')
  , persistanceService = require('../util/persistance-service')
  , Selection = require('../plugins/selection')
  , CameraManager = require('../plugins/camera-manager')
  , Grid = require('../plugins/grid')
  , LevelLogicOverlay = require('../plugins/level-logic-overlay')
  , GroupManager = require('../plugins/group-manager/group-manager')
  , BackgroundManager = require('../plugins/background-manager')
  , DraggingSelectionOverlay = require('../plugins/dragging-selection-overlay')
  , UImanager = require('../plugins/ui-manager')
  , setupWorkspace = require('../util/workspace')
  , screenProperties = require('screen-properties')
  , editorProperties = require('editor-properties')
  , staticAtlasList = require('static-entity-index').textureAtlases
  , staticImageList = require('static-entity-index').images
  , welcomeWizard = require('../util/modals/welcome-wizard')
  , introMessage = require('../util/modals/intro-message')

require('jQuery')
require('jQueryUI')

module.exports = function (game) {

  var editor = {}
    , entityBuilder
    , workspace = null

    , plugins =
      { grid:null
      , cameraManager:null
      , selection:null
      , entityPalette:null
      , uiManager:null
      , groupManager:null
      , levelLogicOverlay:null
      , draggingSelectionOverlay:null
      , backgroundManager: null
      }

  function configureDomEvents() {
    persistanceService.setupFileUploadEvent(editor.displayLevelData)
    setupUnsavedChangesCheck()
  }

  function setupUnsavedChangesCheck() {
    window.onbeforeunload = function() {
      if (workspace.hasUnsavedChanges()) {
        return 'you have unsaved changes'
      }
    }
  }

  editor.create = function () {

    // Parse the dynamically loaded texture atlas's, so the individual images are availible for the plugins. This is NOT the same as LevelParser.loadAssets().
    parseAtlasData(this.game)

    // We set the bounds to infinity here, as we load them from the level data later on
    game.world.setBounds(-500, -500 , Infinity, Infinity)

    workspace = setupWorkspace(game)

    entityBuilder = setupEntityBuilder(game, workspace, moduleManager)

    //Center the map
    centerGame()

    plugins.backgroundManager = game.plugins.add(BackgroundManager, workspace)
    plugins.grid = game.plugins.add(Grid, workspace)

    plugins.cameraManager = game.plugins.add(CameraManager, workspace)

    // We need to init the workspace here so that it creates the groups on top of the previous plugins, but below the ones created afterwards, as they all rely on the workspace
    workspace.init()

    plugins.levelLogicOverlay = game.plugins.add(LevelLogicOverlay, workspace)
    plugins.groupManager = game.plugins.add(GroupManager, workspace, plugins)
    plugins.selection = game.plugins.add(Selection, workspace, entityBuilder)
    plugins.entityPalette = game.plugins.add(EntityPallet, workspace, moduleManager.getList(), plugins, entityBuilder)
    plugins.draggingSelectionOverlay = game.plugins.add(DraggingSelectionOverlay, plugins)
    plugins.uiManager = game.plugins.add(UImanager, workspace, plugins)

    workspace.events.levelCleared.add(centerGame, this)

    $(function() {
      configureDomEvents()
    })

    // If we are in the demo mode on the phaserle website, lock some of the features as they will not work.
    if(editorProperties.lockFeatures) {
      introMessage()
    }

    // Do not perform any scaling.
    game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE

    $(window).resize(resizeGame)

    welcomeWizard()
  }

  function resizeGame() {
    var height = $(window).height()
    var width = $(window).width()

    game.width = width
    game.height = height

    if (game.renderType === Phaser.WEBGL){
      game.scale.setGameSize(width, height)
      game.scale.refresh()
    }
  }

  editor.displayLevelData = function (loadedLevelData, filename) {

    workspace.clear()
    plugins.cameraManager.resetCamera()
    workspace.setGroups(loadedLevelData.groups)
    _.each(loadedLevelData.entities, function(entity) {

      var group = workspace.getGroupByName(entity.group)
        , en = entityBuilder(entity, entity.x, entity.y, group, true, true)

      plugins.selection.setupEntityForSelection(en)
    }, this)

    workspace.setLevelName(filename.split('.')[0])
    workspace.updateLevelHash()

    screenProperties.logicWidth = loadedLevelData.metaData.width
    screenProperties.logicHeight = loadedLevelData.metaData.height

    // Set the saved grid data.
    editorProperties.grid.x = loadedLevelData.metaData.gridWidth
    editorProperties.grid.y = loadedLevelData.metaData.gridHeight
    editorProperties.grid.offsetX = loadedLevelData.metaData.gridOffsetX
    editorProperties.grid.offsetY = loadedLevelData.metaData.gridOffsetY

    // Update the background.
    workspace.backgroundColour = loadedLevelData.metaData.backgroundColour
    workspace.events.backgroundColourChanged.dispatch()

    // Update the grid.
    workspace.events.gridChanged.dispatch()

    // Dispatch the game logic size change.
    workspace.events.gameLogicSettingChanged.dispatch()

    // Set the background colour.
    workspace.backgroundColour = loadedLevelData.metaData.backgroundColour
    workspace.events.backgroundColourChanged.dispatch()

    // Prevents entities being drawn out of bounds.
    game.world.setBounds(-this.game.width/2, -this.game.height/2, Infinity, Infinity)
    game.camera.reset()
    centerGame()

    // Select the top most group.
    workspace.setActiveGroup(workspace.groups[workspace.groups.length-2])
  }

  function centerGame() {
    // Centre the game into the centre of the screen.
    // TODO: we can pull this from the game properties, but I think it'd be best to create a screen size object
    // E.g. screenBorders.getDesktop()

    game.camera.x = -((game.width - 245) / 2) + (screenProperties.logicWidth / 2)
    game.camera.y = -((game.height - 72) / 2) + (screenProperties.logicHeight / 2)
  }

  function parseAtlasData(game) {

    // Loop through each loaded atlas.
    _.forEach(staticAtlasList, function(textureAtlas) {
      if(textureAtlas.isStatic) {

        // Store a reference to the list of frames.
        var frames = game.cache.getFrameData(textureAtlas.key).getFrames()

        // Loop through each image in the atlas.
        _.forEach(frames, function(frame) {

          // Add a new Image to the list of images.
          staticImageList.push({key:textureAtlas.key, frameID:frame.name, isStatic: textureAtlas.isStatic})
        })
      }
    })
  }

  return editor
}
