var modal = require('modal')
  , createGroupTemplate = require('../../../../templates/modals/create-group.jade')

module.exports = function createGroupModal(workspace) {
  var modalOptions =
    { title: 'Group Options'
    , overlayClassName: 'modal-container confirm group-options'
    , content: $(createGroupTemplate({ group: {} }))
    , buttons:
      [ { text: 'Add Group', event: 'confirm', className: 'btn-primary', keyCodes: [13] }
      , { text: 'Cancel', event: 'cancel', className: '', keyCodes: [27] }
      ]
    }
  , self = this

  modal(modalOptions)
    .on('confirm', function() {
      workspace.addGroup($('form.group-options input[name=name]').val())
      self.refreshGroups()
    })
}
