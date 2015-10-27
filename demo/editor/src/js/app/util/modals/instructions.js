var modal = require('modal')
  , InstructionsTemplate = require('../../../../templates/modals/instructions.jade')
  , EditorProperties = require('editor-properties')

module.exports = function() {

  var modalOptions =
    { overlayClassName: 'instructions'
    , title: 'Help'
    , content: $(InstructionsTemplate(EditorProperties))
    , buttons: []
    }

  modal(modalOptions)
}
