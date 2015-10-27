var modal = require('modal')
  , entityOptionsTemplate = require('../../../../templates/modals/entity-property-form.jade')
  , optionsRowTemplate = require('../../../../templates/modals/entity-option.jade')
  , objectMapper = require('../object-mapper')

module.exports = function(entity, snapGridCallback, x, y) {

  var entityProperties = objectMapper.flatten(entity.levelEditorProperties)
    , padding = 50
    , modalOptions =
    { title: entity.levelEntityId
    , overlayClassName: 'inspector'
    , content: $(entityOptionsTemplate({ object: entityProperties }))
    , buttons: []
    }

  if(entity.levelEntityId === 'image') {
    if(entity.frameID) {
      modalOptions.title = entity.frameID
    }else {
      modalOptions.title = entity.key.slice(entity.key.lastIndexOf('/')+1, entity.key.length-1)
    }
  }

  modal(modalOptions)

  var autoCompleteOptions = objectMapper.getAutoCompleteList(entity)
    , $modalElement = $('.inspector')
    , $form = $('.inspector form')

  $form.find('input[name=key]').autocomplete({ source: autoCompleteOptions, select: onAutoCompleteSelect })

  $modalElement.find('.add').click(function() {

    $form.find('input[name=key]').unbind('blur')
    $modalElement.find('form').append(optionsRowTemplate())

    var $inputs = $form.find('input[name=key]')
    $inputs.autocomplete(
    { source: autoCompleteOptions
    , select: onAutoCompleteSelect
    }
  )

    $inputs.bind('blur', function(event) {
      objectMapper.getValueFromInput(event, entity)
    })
  })

  function onAutoCompleteSelect(event, object) {
    $(event.target).val(object.item.value)
    $(event.target).parents('.object-property').find('input[name=value]').val('')
    objectMapper.getValueFromInput(event, entity)
    $(event.target).parents('.object-property').find('input[name=value]').select()
    $modalElement.find('form').trigger('change')
  }

  $form.change(function() {
    objectMapper.map(entity, $form)
  })

  $modalElement.find('.snap-grid').click(function() {
    snapGridCallback(entity)
  })

  $modalElement.css({ left: x + padding + 'px', top: y - padding + 'px'})
}
