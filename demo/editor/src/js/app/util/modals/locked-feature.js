var modal = require('modal')
  , template = require('../../../../templates/modals/locked-feature.jade')

module.exports = function() {

  var modalOptions =
    { overlayClassName: 'locked'
    , title: 'Locked'
    , content: $(template())
    , buttons: []
    }

  modal(modalOptions)
}
