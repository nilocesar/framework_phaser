var Phaser = require('Phaser')
  , editorProperties = require('editor-properties')
  , Selection = null
  , _ = require('lodash')
  , MathUtils = require('MathUtils')
  , entityInspector = require('../util/modals/entity-inspector')
  , jQuery = require('jQuery')

  // Instance variables.
  , clipBoard = []
  , selectedEntity = null
  , selectedEntityList = []
  , lastSelectedEntitiyPos = { x: 0, y: 0 }
  , workspace = null
  , entityBuilder
  , mouseIsDown = false
  , selectionStartCtr = 0
  , draggingSelection = null

  , highlightOverlayGroup
  , mouseDownTimeInMS

  , lastMousePos = {}

Selection = function (game, parent) {
  Phaser.Plugin.call(this, game, parent)

  game.input.mouse.mouseDownCallback = _.bind(handleMouseDown, this)
  game.input.mouse.mouseUpCallback = _.bind(handleMouseUp, this)
  game.input.keyboard.onDownCallback = _.bind(handleKeyDown, this)

  game.input.keyboard.addKeyCapture(
    [ Phaser.Keyboard.SPACEBAR
    ]
  )
}

Selection.prototype = Object.create(Phaser.Plugin.prototype)
Selection.prototype.constructor = Selection

Selection.prototype.init = function ($workspace, $entityBuilder) {
  workspace = $workspace
  entityBuilder = $entityBuilder

  workspace.events.levelCleared.add(this.clearSelectedEntities)
  workspace.events.groupRemoved.add(this.clearSelectedEntities)
  workspace.events.activeGroupChanged.add(handleGroupChange, this)
}

function handleGroupChange(viaEntityClick) {
  if (!viaEntityClick) {
    //this.clearSelectedEntities()
   // this.selectAll(workspace.getActiveGroup())
  }
}

Selection.prototype.selectAll = function(group) {
  group.forEach(addEntityToSelectedEntitiesList, this)
}

Selection.prototype.beginDragBoxPoint = {x:0, y:0}
Selection.prototype.isDraggingSelectionBox = false

Selection.prototype.getSelectedEntity = function() {
  return selectedEntity
}

Selection.prototype.update = function () {

  if (mouseIsDown) {
    mouseDownTimeInMS += this.game.time.physicsElapsed * 1000
  }

  // Dont do anything if the user is entering text into a text field.
  if ($('input:focus').length >= 1) {
    return
  }

  //check to see if the mouse
  if (isUserMovingMouse(this.game)) {
    dragSelection(this.game)
  }

  //check to draw a selection box. TODO - REFACTOR INTO DRAGGING SELECTION OVERLAY.
  if (mouseIsDown && !this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR) && draggingSelection === false) {
    selectionStartCtr += this.game.time.physicsElapsed
    if (selectionStartCtr >= .1) {
      this.isDraggingSelectionBox = true
    }
  } else {
    selectionStartCtr = 0
  }

  lastMousePos.x = this.game.input.mousePointer.x
  lastMousePos.y = this.game.input.mousePointer.y
}

function isUserMovingMouse(game) {
  if (Math.abs(game.input.mousePointer.x - lastMousePos.x) > .5 || Math.abs(game.input.mousePointer.y - lastMousePos.y) > .5 ) {
    return true
  }

  return false
}

function dragSelection(game) {
  if (workspace.draggingEntity && !game.input.keyboard.isDown(Phaser.Keyboard.CONTROL) && !game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
    workspace.draggingEntity.x = ((game.input.mousePointer.x - workspace.draggingEntity.mouseOffset.x  ) + game.camera.x)
    workspace.draggingEntity.y = ((game.input.mousePointer.y - workspace.draggingEntity.mouseOffset.y  ) + game.camera.y)

    if (game.input.keyboard.isDown(Phaser.Keyboard.G)) {
      snapGridToEntity(workspace.draggingEntity)
    }

    var diff = { x: 0, y: 0 }

    diff.x = workspace.draggingEntity.x - lastSelectedEntitiyPos.x
    diff.y = workspace.draggingEntity.y - lastSelectedEntitiyPos.y

    if (diff.x !== 0 || diff.y !== 0) {
      _.each(selectedEntityList, function(entity) {
        if (workspace.draggingEntity.id !== entity.id) {
          entity.x += diff.x
          entity.y += diff.y
        }
      })

      draggingSelection = true
    }

    lastSelectedEntitiyPos.x = workspace.draggingEntity.x
    lastSelectedEntitiyPos.y = workspace.draggingEntity.y
  } else {
    draggingSelection = false
  }
}

Selection.prototype.render = function() {
  drawAllSelectedEntitiesHighlightRect()
}

Selection.prototype.selectEntity = function(entity) {

  mouseIsDown = true

  if (entity.isLocked || this.game.input.keyboard.isDown(Phaser.Keyboard.CONTROL) || !isEntityInWorkspaceRect(entity, this.game)) {
    return
  }

  if (workspace.getActiveGroup().name !== entity.group.name) {
    workspace.setActiveGroupViaEntityClick(entity.group)
  }

  //if the entity is not in the selected entities list, and you are not holding shift, clear the selected entities.
  if(_.findIndex(selectedEntityList, { 'id': entity.id }, this) === -1 && !this.game.input.keyboard.isDown(Phaser.Keyboard.SHIFT)) {
    this.clearSelectedEntities()
  }

  addEntityToSelectedEntitiesList(entity)
  selectedEntity = entity
  entity.selected = true

  lastSelectedEntitiyPos.x = selectedEntity.x
  lastSelectedEntitiyPos.y = selectedEntity.y

  //setup workspace dragging.
  workspace.draggingEntity = selectedEntity

  selectedEntity.mouseOffset.x = this.game.input.mousePointer.x-(selectedEntity.x-this.game.camera.x)
  selectedEntity.mouseOffset.y = this.game.input.mousePointer.y-(selectedEntity.y-this.game.camera.y)

  workspace.events.selectedEntityChanged.dispatch(selectedEntity)
}

Selection.prototype.deSelectEntity = function(entity) {
  selectedEntity = null
  entity.selected = false
}

Selection.prototype.clearSelectedEntities = function() {

  _.each(selectedEntityList, function(entity) {
    if (entity.highlightGraphics) {
      entity.highlightGraphics.clear()

      if (entity.parent.name === '__world') {
        entity.parent.removeChild(entity)
        workspace.getActiveGroup().add(entity)
      }

      if (entity.parent.tab.sprite.frameName !== 'group-active.png') {
        entity.parent.tab.sprite.frameName = 'group-idle.png'
      }

      entity.selected = false
    }
  })

  workspace.draggingEntity = null

  selectedEntityList = []
  selectedEntity = null
}

Selection.prototype.setupEntityForSelection = function(entity) {

  this.isDraggingSelectionBox = false
  entity.highlightGraphics = new Phaser.Graphics(this.game, 0, 0)

  if (!highlightOverlayGroup) {
    highlightOverlayGroup = this.game.add.group(workspace.container)
  }

  highlightOverlayGroup.add(entity.highlightGraphics)

  entity.drawHighlightRect = function() {

    if (entity.isLocked || !isEntityInWorkspaceRect(entity, this.game) || !entity.parent.visible) {
      return
    }

    entity.highlightGraphics.clear()
    entity.highlightGraphics.lineStyle(2.5, 0x00FF00, 1)

    //check to see if we are a graphic, or if we have a physics body.
    if (entity.body) {
      entity.highlightGraphics.drawRect(entity.x - (entity.anchor.x * entity.width) + entity.body.offset.x, entity.y - (entity.anchor.y * entity.height) + entity.body.offset.y, entity.body.width, entity.body.height)
    } else {
      entity.highlightGraphics.drawRect(entity.x, entity.y, entity.width, entity.height)
    }

    workspace.container.bringToTop(highlightOverlayGroup)
  }

  entity.justAddedToWorkspace = true
  entity.events.onInputDown.add(this.selectEntity, this, entity)

  entity.events.onInputOver.add(function() {
    if (_.findIndex(selectedEntityList, { 'id': entity.id }, this) === -1 && isEntityInWorkspaceRect(entity, this.game)) {
      entity.drawHighlightRect()

      // Make group buttons use their rollover state.
      if (entity.parent.tab.sprite.frameName !== 'group-active.png') {
        entity.parent.tab.sprite.frameName = 'group-hover.png'
      }
    }
  }, this)

  entity.events.onInputOut.add(function() {
    if (!entity.selected && isEntityInWorkspaceRect(entity, this.game)) {
      entity.highlightGraphics.clear()

      if (entity.parent.tab.sprite.frameName !== 'group-active.png') {
        entity.parent.tab.sprite.frameName = 'group-idle.png'
      }
    }
  }, this)
}

function drawAllSelectedEntitiesHighlightRect() {
  _.each(selectedEntityList, function(entity) {
    if (!entity.destroyPhase) {
     entity.drawHighlightRect()
    }
  })
}

function addEntityToSelectedEntitiesList(en) {

  if (en.isLocked || _.findIndex(selectedEntityList, { 'id': en.id }, this) !== -1) {
    return
  }

  selectedEntityList.push(en)

  en.selected = true
  en.drawHighlightRect()
}

function handleKeyDown(e) {

  // Do not do anything if typing.
  if ($('input:focus').length >= 1) {
    return
  }
  //check to see if we need to delete entities
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.BACKSPACE) || this.game.input.keyboard.isDown(Phaser.Keyboard.DELETE)) {
    deleteAllSelectedEntities(e)
  }

  if (this.game.input.keyboard.isDown(Phaser.Keyboard.G) && this.game.input.keyboard.isDown(Phaser.Keyboard.ALT)) {
    e.preventDefault()
    createGroupFromSelection(this.game)
  }

  if (this.game.input.keyboard.isDown(Phaser.Keyboard.CONTROL) || this.game.input.keyboard.isDown(91)) {
    if (this.game.input.keyboard.isDown(Phaser.Keyboard.C)) {
      //clone the array to your clipBoard
      clipBoard = selectedEntityList.slice(0)
      e.preventDefault()
    } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.V)) {

      var emptySelection = selectedEntityList.length === 0 ? true : false
      this.clearSelectedEntities()
      //paste items....
      var topLeftPos = {x:Infinity, y:Infinity}

      _.each(clipBoard, function(entity) {
        if (entity.x < topLeftPos.x) {
          topLeftPos.x = entity.x
        }

        if (entity.y < topLeftPos.y) {
          topLeftPos.y = entity.y
        }
      })

      //check if all entities are in the same group, if they are, then they can be pasted into the same new group.
      var areAllEntitiesInTheSameGroup = true

      if(clipBoard.length >= 1) {
        targetGroup = clipBoard[0].group.name

        _.each(clipBoard, function(entity) {
          if(entity.group.name !== targetGroup) {
            areAllEntitiesInTheSameGroup = false
          }
        }, this)
      }

      _.each(clipBoard, function(entity) {

        var en

        //check if the group has been deleted, if so paste into the currently selected group
        if(!entity.group.game) {
          en = entityBuilder(entity, (entity.x + this.game.input.mousePointer.x + this.game.camera.x) -topLeftPos.x, (entity.y + this.game.input.mousePointer.y + this.game.camera.y) - topLeftPos.y, workspace.getActiveGroup(), true, true)
        } else if (areAllEntitiesInTheSameGroup) {
          en = entityBuilder(entity, (entity.x + this.game.input.mousePointer.x + this.game.camera.x) -topLeftPos.x, (entity.y + this.game.input.mousePointer.y + this.game.camera.y) - topLeftPos.y, workspace.getActiveGroup(), true, true)
        } else {
          en = entityBuilder(entity, (entity.x + this.game.input.mousePointer.x + this.game.camera.x) -topLeftPos.x, (entity.y + this.game.input.mousePointer.y + this.game.camera.y) - topLeftPos.y, entity.group, true, true)
        }

        en.levelEditorProperties = jQuery.extend(true, {}, entity.levelEditorProperties)

        this.setupEntityForSelection(en)
        addEntityToSelectedEntitiesList(en)
      }, this)

      e.preventDefault()

    } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.A)) {
      this.selectAll(workspace.getActiveGroup())
      e.preventDefault()
    } else if ( this.game.input.keyboard.isDown(Phaser.Keyboard.X)) {
      clipBoard = selectedEntityList.slice(0)
      e.preventDefault()
      deleteAllSelectedEntities()
    }
  }
}

function createGroupFromSelection() {

  // Create an array of the new entities, ignoring any collision objects.
  var newGroupEntitiesList = []
  _.forEach(selectedEntityList, function(entity){

    // Check to see if the entity is a collision area.
    if (!entity.collisionGraphics) {

      // Remove entities from their current group.
      entity.parent.remove(entity)
      newGroupEntitiesList.push(entity)
    }
  },this)

  // If we have more than 1 entity.
  if (newGroupEntitiesList.length >= 1) {

    //Check to see if there are any groups called newGroup. If so, iterate higher
    var newGroupCount = 0
    _.forEach(workspace.groups, function(group) {
      if (group.name.indexOf('newGroup') >= 0) {
        newGroupCount ++
      }
    }, this)

    // Add the new group to the game.
    var newGroup = workspace.addGroup('newGroup'+newGroupCount)

    // Add the entities to the new group.
    _.forEach(newGroupEntitiesList, function(entity) {
      newGroup.add(entity)
    }, this)

    workspace.events.groupsSet.dispatch()
  }
}

function snapGridToEntity(entity) {

  if (entity.body) {
    editorProperties.grid.x = entity.body.width
    editorProperties.grid.y = entity.body.height
    editorProperties.grid.offsetX = (entity.width * entity.anchor.x) - entity.body.offset.x
    editorProperties.grid.offsetY = (entity.height * entity.anchor.y) - entity.body.offset.y
  } else {
    editorProperties.grid.x = entity.width
    editorProperties.grid.y = entity.height
    editorProperties.grid.offsetX = 0
    editorProperties.grid.offsetY = 0
  }

  workspace.events.gridChanged.dispatch(entity)
  snapEntityToGrid( entity )
}

function snapEntityToGrid( entity ) {

  // Get the real x/y here.
  entity.x = Math.round(entity.x / editorProperties.grid.x) * editorProperties.grid.x
  entity.y = Math.round(entity.y / editorProperties.grid.y) * editorProperties.grid.y
}

function deleteAllSelectedEntities(e) {

  if (e) {
    e.preventDefault()
  }

  for(var i = selectedEntityList.length-1; i >= 0 ; i--) {
    for(var j = workspace.entities.length-1; j >=0; j--) {
      if (selectedEntityList[i].id === workspace.entities[j].id) {
        workspace.entities.splice(j, 1)
      }
    }

    selectedEntityList[i].destroy()
    selectedEntityList[i].highlightGraphics.destroy()
    selectedEntityList[i].selected = false

    if (selectedEntityList[i].collisionGraphics) {
      selectedEntityList[i].collisionGraphics.destroy()
    }

    selectedEntityList.splice(i, 1)
  }

  selectedEntityList = []
  workspace.events.deletedSelection.dispatch()
}

function handleMouseUp(e) {
  ///check if we are clicking on a model.
  if (isMouseOnOpenModal(e)) {
    return
  }

  if (workspace.draggingEntity && mouseDownTimeInMS < 200) {

    //check if the entity is on the group pallete
    if(workspace.draggingEntity && !isEntityInWorkspaceRect(workspace.draggingEntity, this.game)) {
      return
    }

    if(!this.game.input.keyboard.isDown(Phaser.Keyboard.SHIFT)) {
      _.each(selectedEntityList, function(entity) {
        entity.highlightGraphics.clear()
        entity.selected = false
      })

      selectedEntityList = [workspace.draggingEntity]
    }else {
      addEntityToSelectedEntitiesList(workspace.draggingEntity)
    }

    selectedEntity = workspace.draggingEntity

    var modalX = workspace.draggingEntity.x + workspace.draggingEntity.width - this.game.camera.x
      , modalY = workspace.draggingEntity.y - this.game.camera.y

    if(modalY > this.game.height - 200) {
      modalY = this.game.height - 200
    }

    if(modalX > this.game.width - 400) {
      modalX = this.game.width - 400
    }

    entityInspector(workspace.draggingEntity, snapGridToEntity, modalX, modalY)
  }

  if (this.isDraggingSelectionBox) {

    if(!this.game.input.keyboard.isDown(Phaser.Keyboard.SHIFT)) {
      this.clearSelectedEntities()
    }

    selectEntitiesWithinSelectionBox(this.game, this.beginDragBoxPoint)
  }

  if (!this.game.input.keyboard.isDown(Phaser.Keyboard.CONTROL) && !this.game.input.keyboard.isDown(91)) {
    workspace.draggingEntity = null
  }

  // 91 == CMD on mac
  if (this.game.input.keyboard.isDown(Phaser.Keyboard.CONTROL) || this.game.input.keyboard.isDown(91)) {
    this.addCollisionRectangle()
  } else if (!this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {

    // Check that we are not on an entity.
    var overEn = false
      , en

    _.each(workspace.entities, function(entity) {

      var rect

      if (entity.body) {
        rect = new Phaser.Rectangle(entity.x + entity.body.offset.x - (entity.anchor.x * entity.body.width), entity.y + entity.body.offset.y - (entity.anchor.y * entity.height), entity.body.width, entity.body.height)
      } else {
        rect = new Phaser.Rectangle(entity.x, entity.y, entity.width, entity.height)
      }

      if (MathUtils.isPointInsideRect(this.game.input.mousePointer.x + this.game.camera.x , this.game.input.mousePointer.y + this.game.camera.y, rect.x-5, rect.y-5, rect.width+10, rect.height+10)) {
        overEn = true
        en = entity
      }
    }, this)

    if (overEn === false && this.isDraggingSelectionBox === false && this.game.input.mousePointer.y >= 140) {
      this.clearSelectedEntities()
    }
  }

  //stop
  this.isDraggingSelectionBox = false
  mouseIsDown = false
  selectionStartCtr = 0
  mouseDownTimeInMS = 0
}

Selection.prototype.addCollisionRectangle = function() {

  // Create new hit area the size of the drag rectangle.
  var dragRect = getDragRectangle(this.game, this.beginDragBoxPoint)

  // Add mouse offset.
  dragRect.x += this.game.camera.x
  dragRect.y += this.game.camera.y

  var collisionGroup = workspace.getGroupByName('collisions')
  var newEn = entityBuilder(dragRect, 0, 0, collisionGroup, true, true)
  this.setupEntityForSelection(newEn)
  addEntityToSelectedEntitiesList(newEn)
  workspace.setActiveGroupViaEntityClick(collisionGroup)
}

function isEntityInWorkspaceRect(entity, game) {

  //check if the entity is on the group pallete
  if(editorProperties.groupPalleteIsOpen && entity.x + entity.width - game.camera.x > game.width - 245) {
    return false
  }

  if(!editorProperties.groupPalleteIsOpen && entity.x + entity.width - game.camera.x > game.width) {
    return false
  }

  if(editorProperties.entityPalleteIsOpen && entity.y > game.camera.y + game.height - 119) {
    return false
  }

  if(!editorProperties.entityPalleteIsOpen && entity.y > game.camera.y + game.height) {
    return false
  }

  return true
}

function handleMouseDown() {

  if (this.game.input.mousePointer.y >= this.game.height - editorProperties.toolbox.maxItemSize.y - editorProperties.toolbox.padding.y || this.game.input.mousePointer.y < 50 || this.game.input.mousePointer.x > this.game.width - 165) {
    return
  }

  this.beginDragBoxPoint.x = this.game.input.mousePointer.x
  this.beginDragBoxPoint.y = this.game.input.mousePointer.y

  mouseIsDown = true
}

function getDragRectangle(game, dragPoint) {

  var w = game.input.mousePointer.x - dragPoint.x
    , h = game.input.mousePointer.y - dragPoint.y
    , startX = 0
    , endY = 0

  if (w < 0) {
    w *= -1
  }
  if (h < 0) {
    h *= -1
  }

  startX = dragPoint.x < game.input.mousePointer.x ? dragPoint.x : game.input.mousePointer.x
  endY = dragPoint.y < game.input.mousePointer.y ? dragPoint.y : game.input.mousePointer.y

  return new Phaser.Rectangle(startX, endY, w, h)
}

function isMouseOnOpenModal(e) {
  if ($('.inspector').position() && MathUtils.isPointInsideRect(e.x, e.y, $('.inspector').position().left, $('.inspector').position().top, $('.inspector').width(), $('.inspector').height())) {
    return true
  }

  return false
}

function selectEntitiesWithinSelectionBox(game, dragPoint) {

  var dragRect = getDragRectangle(game, dragPoint)

  if (!game.input.keyboard.isDown(Phaser.Keyboard.CONTROL)) {

    var rect
      , targetGroup = null
      , shouldSelectNewGroup = false

    // Check if all the entities are within the same, group, if they are, select that group.
    _.each(workspace.entities, function(entity) {
      if (!entity.isLocked && entity.parent.tab.group.visible) {

        if (entity.body) {
          rect = new Phaser.Rectangle(entity.x + entity.body.offset.x - (entity.anchor.x * entity.body.width), entity.y + entity.body.offset.y - (entity.anchor.y * entity.height), entity.body.width, entity.body.height)
        } else {
          rect = new Phaser.Rectangle(entity.x, entity.y, entity.width, entity.height)
        }

        if (MathUtils.doesRectOverlap(rect.x - game.camera.x, rect.y-game.camera.y, rect.width, rect.height, dragRect.x, dragRect.y, dragRect.width, dragRect.height)) {
          addEntityToSelectedEntitiesList(entity)

          if (!targetGroup) {
            targetGroup = entity.parent
            shouldSelectNewGroup = true
          } else {
            if (targetGroup !== entity.parent) {
              shouldSelectNewGroup = false
            }
          }

          //make group buttons use their rollover state
          if (entity.parent.tab.sprite.frameName !== 'group-active.png') {
            entity.parent.tab.sprite.frameName = 'group-hover.png'
          }
        }
      }
    }, this)

    if (shouldSelectNewGroup) {
      workspace.setActiveGroup(targetGroup)
    }
  }
}

module.exports = Selection
