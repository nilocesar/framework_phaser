var modal = require('modal')
  , newLevelTemplate = require('../../../../templates/modals/new-level.jade')
  , properties = require('editor-properties')
  , screenProperties = require('screen-properties')

var persistanceService = require('../persistance-service')
  , newLevelName
  , newLevelWidth
  , newLevelHeight

module.exports = function(workspace,game) {

  var modalOptions =
    { overlayClassName: 'new-level'
    , title: 'New Level'
    , clickOutsideToClose: false
    , content: $(newLevelTemplate())
    , buttons:
      [ { text: 'Confirm', event: 'confirm', className: 'btn-primary', keyCodes: [13], preventModalClosing: true }
      , { text: 'Cancel', event: 'cancel', className: 'btn-default', keyCodes: [27] }
      ]
    }

  modal(modalOptions)
    .on('confirm', function (e) {

      newLevelName = $('input[name=filename]').val()
      newLevelWidth = parseInt($('input[name=width]').val())
      newLevelHeight = parseInt($('input[name=height]').val())

      var modalOptions2 =
      { title: 'Are you sure?'
      , content: 'You will lose any unsaved progress'
      , overlayClassName: 'save-as'
      , buttons:
        [ { text: 'Confirm', event: 'confirm', className: 'btn-danger', keyCodes: [13] }
        , { text: 'Cancel', event: 'cancel', className: 'btn-default', keyCodes: [27] }
        ]
      }

      modal(modalOptions2)
        .on('confirm', createNewLevel)
    })

  function createNewLevel() {

    //clear the current level
    workspace.clear()

    //set the new level width and height data
    screenProperties.logicWidth = newLevelWidth
    screenProperties.logicHeight = newLevelHeight

    workspace.setLevelName(newLevelName)
    //save as new level name.
    persistanceService.save(workspace)
    //remove the modal
    $('.new-level').remove()
    //dispatch the groupsSet signal
    workspace.events.groupsSet.dispatch()
  }
}
