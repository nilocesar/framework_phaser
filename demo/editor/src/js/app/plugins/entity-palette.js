var Phaser = require('Phaser')
  , editorProperties = require('editor-properties')
  , Palette = null
  , MathUtils = require('MathUtils')
  , _ = require('lodash')
  , entityBuilder = require('../util/entity-builder')
  , staticImageList = require('static-entity-index').images

  // Instance variables.
  , imagePaletteWidth = 0
  , entitiesPalleteWidth = 0
  , scroller = null
  , plugins = null
  , entityBuilder = null
  , workspace = null

  , entitiesButton
  , imagesButton
  , isShowingEntities
  , entities
  , images

  , showButton
  , hideButton
  , scrollbarGroup
  , bg
  //is the user dragging the entity pallete bar to move the current group selection?
  , isDraggingGroup

Palette = function (game, parent) {
  Phaser.Plugin.call(this, game, parent)
}

function getMaxFitRatio (entity, maxWidth, game) {
  var max = editorProperties.toolbox.maxItemSize

  if (maxWidth < game.width - 100) {
    max = { x: 60, y: 60 }
  }

  var calculatedScale = Math.min(max.x / entity.width, max.y / entity.height)

  if (entity.width < max.x || entity.height < max.y || calculatedScale > entity.scale.x || calculatedScale > entity.scale.y) {
    if (calculatedScale > entity.scale.y) {
      return  entity.scale.x
    } else if (calculatedScale > entity.scale.x) {
      return  entity.scale.y
    }
  }

  return calculatedScale
}

Palette.prototype = Object.create(Phaser.Plugin.prototype)
Palette.prototype.constructor = Palette

Palette.prototype.isOpen = function() {
  return hideButton.visible
}

Palette.prototype.init = function ($workspace, modules, $plugins, $entityBuilder, staticImages) {

  workspace = $workspace
  plugins = $plugins
  entityBuilder = $entityBuilder

  workspace.events.inputPriorityReset.add(function() {
    workspace.setGroupInputPriority(entities)
  }, this)

  entitiesButton = this.game.add.button(40, this.game.height-119, 'editorAtlas', this.showEntities, this, 'group-selection-entities-active.png', 'group-selection-entities.png', 'group-selection-entities-active.png', 'group-selection-entities-active.png')
  entitiesButton.input.useHandCursor = true
  entitiesButton.fixedToCamera = true
  isShowingEntities = true
  entitiesButton.frameName = 'group-selection-entities-active.png'
  entitiesButton.events.onInputOut.add(function(){
    if (isShowingEntities) {
      entitiesButton.frameName = 'group-selection-entities-active.png'
    }
  }, this)

  imagesButton = this.game.add.button(160, this.game.height-119, 'editorAtlas', this.showImages, this, 'group-selection-images-active.png', 'group-selection-images.png', 'group-selection-images-active.png', 'group-selection-images-active.png')
  imagesButton.input.useHandCursor = true
  imagesButton.fixedToCamera = true
  imagesButton.events.onInputOut.add(function(){
    if (!isShowingEntities) {
      imagesButton.frameName = 'group-selection-images-active.png'
    }
  }, this)

  // Draw background.
  bg = this.game.add.tileSprite(0, this.game.height-95, this.game.width, 95, 'editorAtlas', 'bottom-bar.png')
  bg.fixedToCamera = true

  showButton = this.game.add.button(32, this.game.height-24, 'editorAtlas', showPanel, this, 'open-tab.png', 'open-tab.png', 'open-tab.png', 'open-tab.png')
  showButton.input.useHandCursor = true
  showButton.rotation = MathUtils.toRadians(90)
  showButton.fixedToCamera = true
  showButton.visible = false

  hideButton = this.game.add.button(32, this.game.height-119, 'editorAtlas', hidePanel, this, 'close-tab.png', 'close-tab.png', 'close-tab.png', 'close-tab.png')
  hideButton.rotation = MathUtils.toRadians(90)
  hideButton.input.useHandCursor = true
  hideButton.fixedToCamera = true

  createScroller(this.game)

  entities = this.game.add.group()
  entities.fixedToCamera = true

  images = this.game.add.group()
  images.fixedToCamera = true

  this.buildEntities(modules)
  this.buildImages(staticImages)

  workspace.events.activeGroupChanged.add(handleActiveGroupChanged, this)

  this.showEntities(this.game)

  $(window).resize(_.bind(resizeGame, this))
}

function resizeGame() {
  bg.width = this.game.width

  scrollbarGroup.destroy()

  createScroller(this.game)
}

Palette.prototype.update = function() {
  if (isDraggingGroup) {
    if (isShowingEntities) {
      entities.forEach(function(entity) {
        entity.x = entity.startPos.x - ((scroller.x-10) / (this.game.width-scroller.width-20) * (entitiesPalleteWidth-this.game.width))
      }, this)
    } else {
      images.forEach(function(image) {
        image.x = image.startPos.x - ((scroller.x-10) / (this.game.width-scroller.width-20) * (imagePaletteWidth-this.game.width))
      }, this)
    }
  }
}

Palette.prototype.showEntities = function() {

  isShowingEntities = true

  images.forEach(function(image) {
    image.visible = false
  }, this)

  entities.forEach(function(entity) {
    entity.visible = true
  }, this)

  imagesButton.frameName = 'group-selection-images.png'
  entitiesButton.frameName = 'group-selection-entities-active.png'

  checkScrollbarStatus(this.game)
}

Palette.prototype.showImages = function() {

  isShowingEntities = false

  images.forEach(function(image) {
    image.visible = true
  }, this)

  entities.forEach(function(entity) {
    entity.visible = false
  }, this)

  imagesButton.frameName = 'group-selection-images-active.png'
  entitiesButton.frameName = 'group-selection-entities.png'

  checkScrollbarStatus(this.game)
}

function showPanel() {
  showButton.visible = false
  hideButton.visible = true
  scrollbarGroup.visible = true
  bg.visible = true
  scroller.visible = true
  entitiesButton.visible = true
  imagesButton.visible = true

  moveEntities(-85, entities)
  moveEntities(-85, images)

  editorProperties.entityPalleteIsOpen = true
}

function hidePanel() {
  showButton.visible = true
  hideButton.visible = false
  scrollbarGroup.visible = false
  bg.visible = false
  scroller.visible = false
  entitiesButton.visible = false
  imagesButton.visible = false

  moveEntities(85, entities)
  moveEntities(85, images)

  editorProperties.entityPalleteIsOpen = false
}

function moveEntities(amount, entities) {
  entities.forEach(function(entity) {
    entity.y += amount
  }, this)
}

function handleActiveGroupChanged(groupName) {
  if (groupName === 'collisions') {
    entities.alpha = .5

    entities.forEach(function(entity) {
      entity.inputEnabled = false
    }, this)

    images.alpha = .5

    images.forEach(function(image) {
      image.inputEnabled = false
    }, this)
  } else {
    entities.alpha = 1

    entities.forEach(function(entity) {
      entity.inputEnabled = true
    }, this)

    images.alpha = 1

    images.forEach(function(image) {
      image.inputEnabled = true
    }, this)
  }
}

function createScroller(game) {

  scrollbarGroup = game.add.group()
  scrollbarGroup.fixedToCamera = true

  var scrollbarBg = game.add.tileSprite(10, game.height-12, game.width-20, 12, 'editorAtlas', 'scrollbar-bottom.png')
  scrollbarGroup.add(scrollbarBg)

  var scrollbarBgTopEnd = game.add.image(13, game.height-12, 'editorAtlas', 'scrollbar-end.png')
  scrollbarGroup.add(scrollbarBgTopEnd)
  scrollbarBgTopEnd.rotation = MathUtils.toRadians(90)

  var scrollbarBgBottomEnd = game.add.image(game.width-12, game.height, 'editorAtlas', 'scrollbar-end.png')
  scrollbarGroup.add(scrollbarBgBottomEnd)
  scrollbarBgBottomEnd.rotation = MathUtils.toRadians(-90)

  // TODO: needs to be refactored into entity-palette, but has ties in camera logic.
  scroller = game.add.sprite(10, game.height - 10, 'editorAtlas')
  scroller.animations.add('idle', ['horizontal-scrollbar.jpg'])
  scroller.animations.add('hover', ['horizontal-scrollbar.jpg'])
  scroller.animations.add('selected', ['horizontal-scrollbar.jpg'])
  scroller.animations.play('idle')

  scrollbarGroup.add(scroller)

  //setup events
  scroller.events.onDragStart.add(handleDragGroupStart, this)
  scroller.events.onDragStop.add(handleDragGroupStop, this)

  checkScrollbarStatus(game)
}

function handleDragGroupStart() {
  isDraggingGroup = true
}

function handleDragGroupStop() {
  isDraggingGroup = false
}

function checkScrollbarStatus(game) {

  if (isShowingEntities && entitiesPalleteWidth > game.width - 100) {
    enableScroller(game)
  } else if (!isShowingEntities && imagePaletteWidth > game.width - 100){
    enableScroller(game)
  } else {
    disableScroller()
  }
}

function disableScroller() {
  scroller.alpha = .5
  scroller.inputEnabled = false
}

function enableScroller(game) {
  scroller.inputEnabled = true
  scroller.alpha = 1
  scroller.input.useHandCursor = true

  scroller.events.onDragStart.add(function(sprite) {
    sprite.animations.play('selected')
  })

  scroller.events.onDragStop.add(function(sprite) {
    sprite.animations.play('hover')
  })

  scroller.events.onInputOver.add(function(sprite) {
    sprite.animations.play('hover')
  })

  scroller.events.onInputOut.add(function(sprite) {
    sprite.animations.play('idle')
  })

  // lockCenter, bringToTop, pixelPerfect, alphaThreshold, boundsRect, boundsSprite
  scroller.input.enableDrag(false, false, false, 255, new Phaser.Rectangle(10, game.height-10, game.width-20, scroller.height))
  scroller.input.setDragLock(true, false)
}

Palette.prototype.addEntityToWorkspace = function (entity) {
  // Bounce out if the user is using the slider.
  if (scroller && this.game.input.mousePointer.y >= this.getScrollerPosition().y) {
    return
  }

  //add a new item to the level.
  var newEntity = entityBuilder(entity, entity.x, entity.y, workspace.getActiveGroup(), null ,true)

  plugins.selection.clearSelectedEntities()
  plugins.selection.setupEntityForSelection(newEntity)
  plugins.selection.selectEntity(newEntity)

  workspace.draggingEntity = newEntity
  workspace.entities.push(newEntity)
  workspace.draggingEntity.x = ((this.game.input.mousePointer.x - workspace.draggingEntity.mouseOffset.x) + this.game.camera.x)
  workspace.draggingEntity.y = ((this.game.input.mousePointer.y - workspace.draggingEntity.mouseOffset.y) + this.game.camera.y)

  if (workspace.draggingEntity.body) {
    workspace.draggingEntity.mouseOffset.x = workspace.draggingEntity.body.offset.x+(workspace.draggingEntity.anchor.x * workspace.draggingEntity.body.width)
    workspace.draggingEntity.mouseOffset.y = workspace.draggingEntity.body.offset.y+(workspace.draggingEntity.anchor.y * workspace.draggingEntity.body.height)
  } else {
    workspace.draggingEntity.mouseOffset.x = workspace.draggingEntity.anchor.y * workspace.draggingEntity.width
    workspace.draggingEntity.mouseOffset.y = workspace.draggingEntity.anchor.y * workspace.draggingEntity.height
  }

  // Reset the dragging entities position.
  entity.x = entity.startPos.x
  entity.y = entity.startPos.y

  if (isShowingEntities) {
    entity.x = entity.startPos.x - ((scroller.x-10) / (this.game.width-scroller.width-20) * (entitiesPalleteWidth-this.game.width))
  } else {
    entity.x = entity.startPos.x - ((scroller.x-10) / (this.game.width-scroller.width-20) * (imagePaletteWidth-this.game.width))
  }

  workspace.events.inputPriorityReset.dispatch()

  return entity
}

Palette.prototype.getScrollerPosition = function() {
  return { x: scroller.x-scroller.height, y: scroller.y }
}

Palette.prototype.buildEntities = function (modules) {

  var xPos = editorProperties.toolbox.padding.x
    , yPos = this.game.height - editorProperties.toolbox.maxItemSize.y - editorProperties.toolbox.padding.y

  _.each(modules, function(module, entityName) {

    if (entityName !== 'collision-area') {
      var entity = entityBuilder({ levelEntityId: entityName }, xPos, yPos, entities, false, true)

      entity.isEditorItem = true

      var startPos = { x: xPos, y: yPos }
      entity.startPos = startPos

      entity.scale.setTo(getMaxFitRatio(entity, this.getWidth(), this.game))
      entity.anchor.setTo(0, 0)

      // Add a new entity on mouse down.
      entity.events.onInputDown.add(this.addEntityToWorkspace, this, entity)

      xPos += entity.width + editorProperties.toolbox.padding.x
      entitiesPalleteWidth = xPos
    }
  }, this)
}

Palette.prototype.buildImages = function () {

  var xPos = editorProperties.toolbox.padding.x
    , yPos = this.game.height - editorProperties.toolbox.maxItemSize.y - editorProperties.toolbox.padding.y

  _.each(staticImageList, function(imageData) {

    if(!imageData.isStatic) {
      return
    }

    var image = null

    if (imageData.path) {
      image = entityBuilder({ levelEntityId: 'image', key: imageData.path }, xPos, yPos, images, false, true)
      image.key = imageData.path
    } else {
      image = entityBuilder({ levelEntityId: 'image', key: imageData.key, frameID: imageData.frameID }, xPos, yPos, images, false, true)
      image.key = imageData.key
    }

    image.editorStartXPos = xPos
    image.editorStartYPos = yPos
    image.isEditorItem = true

    var startPos = { x: xPos, y: yPos }
    image.startPos = startPos

    image.scale.setTo(getMaxFitRatio(image, this.getWidth(), this.game))
    image.anchor.setTo(0, 0)

    // Add a new entity on mouse down.
    image.inputEnabled = true
    image.useHandCursor = true
    image.events.onInputDown.add(this.addEntityToWorkspace, this, image)
    image.isImage = true
    image.frameID = imageData.frameID

    xPos += image.width + editorProperties.toolbox.padding.x
    imagePaletteWidth = xPos
  }, this)
}

Palette.prototype.getWidth = function () {

  if (isShowingEntities) {
    return entitiesPalleteWidth
  }

  return imagePaletteWidth
}

module.exports = Palette
