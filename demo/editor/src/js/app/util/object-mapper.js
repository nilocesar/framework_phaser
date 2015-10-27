var _ = require('lodash')
  , mathUtils = require('MathUtils')
  , objectMapper = {}
  , reflection = require('./reflection')

objectMapper.getValueFromInput = function(event, object, key) {

  key = key || $(event.target).val()

  // First check if a property is specified in the custom properties object.
  var $valueInput = $(event.target).parents('.object-property').find('input[name=value]')

  // Don't auto populate if there is no key, or the value has already been set.
  if (key === '' || $valueInput.val() !== '') {
    return
  }

  var value = reflection.get(object.levelEditorProperties, key)

  if (typeof value === 'undefined') {
    // Fall back to the default object properties.
    value = reflection.get(object, key)
    console.log('fell back and found: ', value, 'on object root')
  }

  $valueInput.val(value)
}

objectMapper.map = function(object, $form) {

  object.levelEditorProperties = {}

  // Copy to object store used for persistence.
  _.each($form.find('.object-property'), function(group) {

    var key = $(group).find('input[name=key]').val()
      , value = $(group).find('input[name=value]').val()

    if (key === '') {
      return
    }

    if (mathUtils.isNumber(value)) {
      value = parseFloat(value)
    }

    reflection.set(object.levelEditorProperties, key, value)
  })

  console.info('properties saved', object.levelEditorProperties)
}

objectMapper.getAutoCompleteList = reflection.getAutoCompleteList
objectMapper.flatten = reflection.flatten

module.exports = objectMapper
