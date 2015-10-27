var _ = require('lodash')
  , Phaser = require('Phaser')
  , CollisionArea = require('./collision-area')

module.exports = function(game, workspace, moduleManager) {

  var newId = 0
    , functionsToNerf = ['update', 'postUpdate', 'preUpdate']
    , functionsToNerf_collisionEntity = ['postUpdate', 'preUpdate']
    , emptyFunction = function() {}

  var entityBuilder = function(entityData, x, y, group, addToWorkspace, isInEditor) {

    group = group || workspace.getActiveGroup()

    var entity
    // TODO: needs to be the currentlySeletedGroup
    if (entityData.group === 'collisions' || group.name === 'collisions' || entityData.levelEntityId === 'Collision Area') {
      //collision entities need a rectangle passed to this for their size. We also need to leave the update method as it was.
      group = workspace.getGroupByName('collisions')
      if(entityData.levelEntityId === 'Collision Area') {
        entity = new CollisionArea(game, x, y, new Phaser.Rectangle(x, y, entityData.width, entityData.height), isInEditor, group, workspace.collisionGraphicOverlay)
      }else {
        entity = new CollisionArea(game, x, y, new Phaser.Rectangle(entityData.x, entityData.y, entityData.width, entityData.height), isInEditor, group, workspace.collisionGraphicOverlay)
      }

      nerfUpdateFunction(entity, functionsToNerf_collisionEntity)
      entity.levelEntityId = 'Collision Area'
    } else if( entityData.levelEntityId === 'image') {
      entity = new Phaser.Image(game,x,y, entityData.key, entityData.frameID)
      entity.frameID = entityData.frameID
      entity.key = entityData.key
      entity.levelEntityId = entityData.levelEntityId
    } else {
      entity = moduleManager.create(entityData.levelEntityId, game, x, y)
      nerfUpdateFunction(entity, functionsToNerf)
      entity.levelEntityId = entityData.levelEntityId
    }

    if (isInEditor) {
      entity.inputEnabled = true
      entity.input.useHandCursor = true
      entity.input.priorityID = ++workspace.priorityID
      entity.mouseOffset = { x: entity.width / 2, y: entity.height / 2 }
    }

    entity.levelEditorProperties = entityData.properties ? entityData.properties : {}

    if (addToWorkspace) {
      workspace.entities.push(entity)
    }

    group.add(entity)
    entity.group = group

    if (entity.init) {
      entity.init(isInEditor)
    }

    entity.id = newId++

    return entity
  }

  function nerfUpdateFunction(entity, functions) {
    _.each(functions, function(property) {
      entity[property] = emptyFunction
    })
  }

  return entityBuilder
}
