var $fileDialog = null
  , persistanceService = {}
  , properties = require('editor-properties')
  , saveAsModalTemplate = require('../../../templates/modals/save-as.jade')
  , modal = require('modal')
  , levelPrinter = require('./level-printer')
  , lockedFeature = require('./modals/locked-feature')

persistanceService.setupFileUploadEvent = function(callback) {
  $fileDialog = $('input[name=load-level]')
  $fileDialog.bind('change', function(event) {

    var file = event.target.files[0]
      , reader = new FileReader()

    reader.onload = function() {
      callback(JSON.parse(reader.result), file.name)
      // The file browser is launched on change, this enables reloading of the same file.
      $fileDialog.val('')
    }

    reader.readAsText(file)
  })
}

persistanceService.loadLevel = function () {

  if (properties.lockFeatures) {
    lockedFeature()
    return
  }

  $fileDialog.trigger('click')
}

persistanceService.save = function (workspace) {

  if(properties.lockFeatures) {
    lockedFeature()
    return
  }

  if (workspace.levelName === properties.defaultLevelName) {
    return persistanceService.saveAs(workspace)
  }

  persistLevel(workspace)
}

persistanceService.saveAs = function (workspace) {

  if(properties.lockFeatures) {
    lockedFeature()
    return
  }

  var modalOptions =
    { title: 'Save As'
    , content: $(saveAsModalTemplate({ levelName: workspace.levelName }))
    , overlayClassName: 'save-as'
    , clickOutsideToClose: false
    , buttons:
      [ { text: 'Save', event: 'confirm', className: 'btn-primary', keyCodes: [13] }
      , { text: 'Cancel', event: 'cancel', keyCodes: [27] }
      ]
    }

  modal(modalOptions)
    .on('confirm', function () {
      // TODO: need validation.
      workspace.setLevelName($('input[name=filename]').val())
      persistanceService.save(workspace)
    })
}

function persistLevel (workspace) {
  var packedLevelData = levelPrinter(workspace)
    ,  result = { levelData: packedLevelData }

  $.ajax(
    { type: 'POST'
    , url: 'save'
    , data: JSON.stringify(result)
    , success: function() {
        workspace.updateLevelHash()
      }
    , contentType: 'application/json'
    }
  ).fail(saveFailed)
}

function saveFailed () {
  alert('Internal Server Error')
}

module.exports = persistanceService
