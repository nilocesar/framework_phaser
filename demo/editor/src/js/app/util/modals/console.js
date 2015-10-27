var modal = require('modal')
  , htmlTerminal = require('../../../../templates/modals/console-output.jade')

module.exports = function createGroupModal() {
  var modalOptions =
    { title: 'Build Progress'
    , overlayClassName: 'confirm'
    , content: $(htmlTerminal())
    , buttons: []
    }

  return modal(modalOptions)
}
