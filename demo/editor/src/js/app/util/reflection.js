var reflection = {}
  , _ = require('lodash')
  , properties = require('editor-properties')

reflection.exists = function(object, key) {
  return typeof reflection.lookupValue(object, key) !== 'undefined'
}

reflection.get = function(object, key) {

  var parts = key.split('.')
    , currentValue = object

  _.each(parts, function(key) {

    // If the object path can't be found.
    if (typeof currentValue === 'undefined' || typeof currentValue[key] === 'undefined') {
      return currentValue = undefined
    }

    currentValue = currentValue[key]
  })

  return currentValue
}

reflection.set = function(object, key, value) {
  var parts = key.split('.')
    , finalKey = parts.pop()
    , currentDestination = object

  _.each(parts, function(part) {

    if (typeof currentDestination[part] === 'undefined') {
      currentDestination[part] = {}
    }

    currentDestination = currentDestination[part]
  })

  currentDestination[finalKey] = value
}

reflection.flatten = function(source, exclude) {

  var hash = {}

  function step(object, currentKey) {
    _.forIn(object, function(value, key) {

      var newKey = currentKey ? currentKey + '.' + key : key

      if (isTooDeep(currentKey) || exclude && keyContainsExcludeWord(key)) {
        // console.log('skipping', newKey)
        return
      }

      if (_.isObject(value)) {
        step(value, newKey)
      } else {
        // console.log(newKey)
        hash[newKey] = value
      }
    })
  }

  step(source)

  return hash
}

function isTooDeep(propertyName) {
  return propertyName && propertyName.split('.').length >= properties.autoComplete.depth
}

function keyContainsExcludeWord(key) {

  var found = false

  _.each(properties.autoComplete.exclude, function(term) {
    if (key.indexOf(term) >= 0) {
      found = true
    }
  })

  return found
}

reflection.getAutoCompleteList = function(source) {
  return _.keys(reflection.flatten(source, true))
}

module.exports = reflection
