var npmProperties = require('../../../../package.json')

module.exports =
  { title: 'Phaser Level Editor'
  , description: 'A level editor for the Phaser framework.'
  , version: npmProperties.version
  , analyticsId: 'UA-58421244-1'
  , showStats: false
  , liveReloadPort: 3022

  , excludeFilePatterns: ['abstract', '.DS_Store', 'Thumbs']
  , defaultLevelName: 'Untitled'

  // Grid size for selection to snap to.
  , grid:
    { x: 40
    , y: 40
    , offsetX:0
    , offsetY:0
    }

  , buttonPadding: 10
  , toolbox:
    { maxItemSize: { x: 60, y: 60 }
    , padding: { x: 10, y: 25 }
    }

  , autoComplete:
    { exclude:
      [ '_'
      , 'baseTexture'
      , 'children'
      , 'events'
      , 'game'
      , 'group'
      , 'highlightGraphics'
      , 'levelEntityId'
      , 'parent'
      , 'sprite'
      , 'stage'
      , 'tab'
      , 'transformCallbackContext'
      ]
    , depth: 5
    }

  , showGameLogicSize: true
  , lockFeatures: false

  , entityPalleteIsOpen: true
  , groupPalleteIsOpen: true
  }
