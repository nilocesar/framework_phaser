var properties = require('editor-properties')
  , Phaser = require('Phaser')
  , _ = require('lodash')
  , md5 = require('blueimp-md5').md5
  , emptyArray = require('../util/empty-array')
  , levelPrinter = require('../util/level-printer')
  , screenProperties = require('screen-properties')

  // Instance variables.
  , workspace =
    { entities: []
    , draggingEntity: null
    , levelName: properties.defaultLevelName
    , lastSavedLevelHash: null
    , events:
      { levelNameChanged: new Phaser.Signal()
      , levelCleared: new Phaser.Signal()
      , groupsSet: new Phaser.Signal()
      , groupRemoved: new Phaser.Signal()
      , activeGroupChanged: new Phaser.Signal()
      , gameLogicSettingChanged: new Phaser.Signal()
      , selectedEntityChanged: new Phaser.Signal()
      , gridChanged: new Phaser.Signal()
      , backgroundColourChanged: new Phaser.Signal()
      , inputPriorityReset: new Phaser.Signal()
      , deletedSelection: new Phaser.Signal()
      }
    , groups: []
    , container: null
    , collisionGraphicOverlay: null
    , priorityID: 0
    , backgroundColour: '0x000000'
    }

  // Private.
  , activeGroup = null

module.exports = function(game) {

  workspace.init = function() {
    createDefaultGroup()
    workspace.updateLevelHash()
  }

  workspace.deleteGroup = function(name) {

    if(name === 'collisions') {
      return
    }

    var group = _.find(workspace.groups, { name: name })
      , newGroups = []

    _.each(workspace.groups, function(group) {
      if (group.name !== name) {
        newGroups.push(group)
      }
    })

    workspace.groups = newGroups

    //remove all the entities from the group from the entities array
    group.forEach(function(groupEntity) {
      for(var i = workspace.entities.length-1; i >=0; --i) {
        if(workspace.entities[i] && groupEntity.id === workspace.entities[i].id) {

          if( workspace.entities[i].highlightGraphics) {
            workspace.entities[i].highlightGraphics.clear()
          }

          workspace.entities.splice(i, 1)
          break
        }
      }
    }, this)

    group.destroy()

    workspace.setActiveGroup(workspace.groups[workspace.groups.length-1])
    workspace.events.groupsSet.dispatch()
  }

  workspace.addGroup = function(groupName, properties, collisionData) {

    if(_.find(workspace.groups, { name: groupName })) {
      return
    }

    var group = game.add.group(workspace.container, groupName)
    group.levelEditorProperties = properties || {}
    group.levelEditorCollisionData = collisionData || []

    var lastGroup = _.max(workspace.groups, 'z')

    if (lastGroup && lastGroup.z >= 0) {
      group.z = lastGroup.z - .5
    } else {
      group.z = 0
    }

    workspace.groups.push(group)
    workspace.setActiveGroup(group)

    return group
  }

  workspace.getGroupByName = function(name) {
    return _.find(workspace.groups, { name: name })
  }

  workspace.setLevelName = function (text) {
    workspace.levelName = text
    workspace.events.levelNameChanged.dispatch(text)
  }

  workspace.lockGroup = function (group) {

    group.isLocked = !group.isLocked

    group.forEach(function(entity) {
      entity.isLocked = group.isLocked
    })

    resetInputPriority()
  }

  workspace.updateLevelHash = function() {
    workspace.hashLevelData = hashLevelData()
  }

  workspace.clear = function (addDefaultGroup) {

    _.each(workspace.entities, function (item) {

      if(item.collisionGraphics) {
        item.collisionGraphics.destroy()
      }

      if(item.highlightGraphics) {
        item.highlightGraphics.destroy()
      }

      item.destroy()
    })

    emptyArray(workspace.entities)
    deleteAllGroups()

    if(addDefaultGroup) {
      workspace.addGroup('defaultGroup')
    }

    //entityBuilder.setLevelData(workspace.entities)
    //TODO - We need to dispatch signals here.
    properties.grid.x = 40
    properties.grid.y = 40
    properties.grid.offsetX = 0
    properties.grid.offsetY = 0

    screenProperties.logicWidth = 720
    screenProperties.logicHeight = 480

    workspace.events.gameLogicSettingChanged.dispatch()
    workspace.events.gridChanged.dispatch()

    workspace.updateLevelHash()

    workspace.events.levelCleared.dispatch()
  }

   workspace.hasUnsavedChanges = function () {
    return hashLevelData() !== workspace.hashLevelData
  }

  workspace.setGroups = function(groups) {
    deleteAllGroups()

    _.each(groups, function(group) {
      workspace.addGroup(group.name, group.properties, group.collisionData)
    })

    workspace.events.groupsSet.dispatch()
  }

  workspace.getActiveGroup = function() {
    return activeGroup
  }

  workspace.setActiveGroupViaEntityClick = function(group) {
    workspace.setActiveGroup(group, true)
  }

  workspace.setActiveGroup = function(group, viaEntityClick) {

    viaEntityClick = _.isUndefined(viaEntityClick) ? false : viaEntityClick

    if (workspace.groups.length <= 0) {
      return
    }

    if (_.isUndefined(group)) {
      group = _.first(workspace.groups)
    }

    activeGroup = group
    resetInputPriority()
    workspace.events.activeGroupChanged.dispatch(group.name, viaEntityClick)
  }

  workspace.orderGroups = function() {
    if(workspace.getGroupByName('collisions')) {
      workspace.getGroupByName('collisions').z = workspace.groups.length+1
    }

    workspace.groups = _.sortBy(workspace.groups, 'z')
    workspace.container.sort()
  }

  workspace.moveGroup = function (workspace, group, targetPos) {
  var currentPosition = group.z
    , newPosition = targetPos

  var groupAtDestination = _.find(workspace.groups, { z: newPosition })

  if(!groupAtDestination) {
    return
  }

  groupAtDestination.z = currentPosition
  group.z = newPosition
  workspace.orderGroups()
}

  function resetInputPriority() {

    workspace.priorityID = 0

    //collisions have highest input, so set first.
    workspace.setGroupInputPriority(workspace.collisionGraphicOverlay)

    _.each(workspace.groups, function(group) {

      if (group.name !== activeGroup.name) {
        workspace.setGroupInputPriority(group)
      }
    })

    workspace.setGroupInputPriority(activeGroup)
    workspace.events.inputPriorityReset.dispatch(workspace.priorityID)
  }

  workspace.setGroupInputPriority = function(group) {
    group.forEach(function (entity) {
      if(entity.levelEntityId !== 'collision-graphic') {
        if (group.isLocked) {
          // A priorityID of -1 prevents input events from being triggered.
          entity.input.priorityID = -1
        } else {
          entity.input.priorityID = ++workspace.priorityID
        }
      }
    })
  }

  function hashLevelData() {
    return md5(JSON.stringify(levelPrinter(workspace)))
  }

  function deleteAllGroups() {
    _.each(workspace.groups, function(group) {
      workspace.deleteGroup(group.name)
    })
  }

  function createDefaultGroup() {

    if (!workspace.container) {
      workspace.container = game.add.group(game.world, 'workspace')
      workspace.collisionGraphicOverlay = game.add.group(game.world, 'collisionGraphicOverlay')
    }

    workspace.addGroup('defaultGroup')
    workspace.addGroup('collisions')
    workspace.orderGroups()
  }

  return workspace
}
