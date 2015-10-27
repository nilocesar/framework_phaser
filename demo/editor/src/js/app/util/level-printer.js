var _ = require('lodash')
  , screenProperties = require('screen-properties')
  , editorProperties = require('editor-properties')

module.exports = function (workspace) {

  var packedLevelData = {}

  packedLevelData.entities = _.map(workspace.entities, function (entity) {
    if(entity.levelEntityId !== 'collision-graphic') {

      var data =
      { levelEntityId: entity.levelEntityId
      , properties: entity.levelEditorProperties
      , x: entity.x
      , y: entity.y
      , width: entity.width
      , height: entity.height
      , group: entity.group.name
      }

      if(entity.levelEntityId === 'image') {
        data.key = entity.key
        data.frameID = entity.frameID
      }

      return data
    }
  })

  packedLevelData.metaData =
    { levelName: workspace.levelName
    , backgroundColour : workspace.backgroundColour
    , width : screenProperties.logicWidth
    , height : screenProperties.logicHeight
    , gridWidth: editorProperties.grid.x
    , gridHeight: editorProperties.grid.y
    , gridOffsetX: editorProperties.grid.offsetX
    , gridOffsetY: editorProperties.grid.offsetY
    }

  packedLevelData.groups = _.map(workspace.groups, function (group) {
    var data =
      { name: group.name
      , properties: group.levelEditorProperties
      , collisionData: group.levelEditorCollisionData
      }

    return data
  })

  return packedLevelData
}
