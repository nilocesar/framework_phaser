var modal = require('modal')

module.exports =  function (callback, args) {
  var modalOptions =
    { title: 'Confirm'
    , content: 'Are you sure about that?'
    , overlayClassName: 'confirm'
    , buttons:
      [ { text: 'Confirm', event: 'confirm', className: 'btn-danger', keyCodes: [13] }
      , { text: 'Cancel', event: 'cancel', className: 'btn-default', keyCodes: [27] }
      ]
    }

  modal(modalOptions)
    .on('confirm', function (e) {
      callback(args)
    })
}
