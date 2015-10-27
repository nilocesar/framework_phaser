var modal = require('modal')
  , groupFormTemplate = require('../../../../templates/modals/group-property-form.jade')
  , optionsRowTemplate = require('../../../../templates/modals/entity-option.jade')
  , objectMapper = require('../../util/object-mapper')
  , confirmAction = require('../../util/modals/confirm-action')
  , _ = require ('lodash')

  , workspace = null
  , __tab__ = false
  , $modalElement = null

module.exports = function showGroupModal($workspace, tab) {

  workspace = $workspace
  __tab__ = tab

  var groupProperties = objectMapper.flatten(tab.group.levelEditorProperties)
    , modalOptions =
      { title: ''
      , overlayClassName: 'inspector group-modal'
      , content: $(groupFormTemplate(
          { group: groupProperties
          , name: tab.group.name
          , otherGroups: workspace.groups
          }
        ))
      , buttons: []
      }

  var modalControls = modal(modalOptions)
    , $form = $('.group-property-form')

  $modalElement = $('.inspector')

  var autoCompleteOptions = objectMapper.getAutoCompleteList(tab.group)

  $form.find('input[name=key]').autocomplete({ source: autoCompleteOptions, select: onAutoCompleteSelect})

  setupLockButton($modalElement, tab, workspace)
  setupSaveAndDeleteEvents($modalElement, $form, workspace, tab, modalControls)
  setupOrderButtonEvents($modalElement, workspace, tab)
  setupObjectPropertyEvents($modalElement, $form, tab, autoCompleteOptions)

  restoreGroupCollisionState($modalElement, tab.group)
  setupGroupCollisionEvents($modalElement)

  setupAccordian()
}

function setupAccordian() {
  $('.accordion').accordion({ heightStyle: 'content' })
}

function restoreGroupCollisionState($modal, group) {

  if (!group.levelEditorCollisionData.length) {
    return
  }

  _.each(group.levelEditorCollisionData, function(data) {

    var $itemForm = $('.collision-item.js-' + data.collidesWith)
      , $inputs = $itemForm.find('.collision-item-inputs')

    $itemForm.find('input[type=checkbox]').prop('checked', true)
    $inputs.find('input.' + data.type).prop('checked', true)

    $inputs.show()

    if (data.actionCallback) {
      $inputs.find('input[name=action-callback]').val(data.actionCallback)
    }

    if (data.processCallback) {
      $inputs.find('input[name=process-callback]').val(data.processCallback)
    }
  })
}

function setupGroupCollisionEvents($modal) {
  $modal.find('.checkbox input[type=checkbox]').change(function() {

    var $form = $(this).parents('.collision-item').find('.collision-item-inputs')
    $form.toggle()
    $form.find('.collide').attr('checked', 'checked')
  })
}

function setupLockButton($modal, tab, workspace) {
  $modal.find('.lock').click(function() {
    workspace.lockGroup(tab.group)
    showLockedStatus(tab.group, $modal.find('.lock'))
  })
  showLockedStatus(tab.group, $modal.find('.lock'))
}

function setupSaveAndDeleteEvents($modal, $form, workspace, tab, modalControls) {
  $modal.find('form').change(function() {
    mapNameToGroup(tab, $form)
    objectMapper.map(tab.group, $form)
    setCollisionData(tab.group, $form)
    workspace.events.groupsSet.dispatch()
  })

  if(tab.group.name !== 'collisions') {
    $modal.find('#delete-group').click(function(e) {
      e.preventDefault()
      confirmAction(deleteGroup,[tab.group.name,modalControls])
    })
  } else {
    $("#delete-group").remove()
  }
}

function deleteGroup(args) {
  workspace.deleteGroup(args[0])
  args[1].close()
}

function mapNameToGroup(tab, $form) {
  var name = $form.find('input[name=name]').val()
  tab.text.text = tab.group.name = name
}

function setCollisionData(group, $form) {
  group.levelEditorCollisionData = []

  $form.find('input[type=checkbox]:checked').each(function() {

    var $itemForm = $(this).parents('.collision-item').find('.collision-item-inputs')
      , actionCallback =  $itemForm.find('input[name=action-callback]').val()
      , processCallback =  $itemForm.find('input[name=process-callback]').val()
      , collisionData =
        { collidesWith: $(this).val()
        , type: $itemForm.find('input[type=radio]:checked').val()
        , actionCallback: actionCallback ? actionCallback : false
        , processCallback: processCallback ? processCallback : false
        }

    group.levelEditorCollisionData.push(collisionData)
  })
}

function showLockedStatus(group, $lockButton) {
  if (group.isLocked) {
    $lockButton.addClass('btn-warning')
    $lockButton.html('locked')
  } else {
    $lockButton.removeClass('btn-warning')
    $lockButton.html('lock')
  }
}

function setupObjectPropertyEvents($modal, $form, tab, autoCompleteOptions) {
  $modal.find('.add').click(function() {

    $modal.find('.property-container').append(optionsRowTemplate())

    var $inputs = $form.find('input[name=key]')
    $inputs.autocomplete(
      { source: autoCompleteOptions
      , select: onAutoCompleteSelect
      }
    )

    $inputs.unbind('blur')
    $inputs.bind('blur', function(event) {
      objectMapper.getValueFromInput(event, tab.group)
    })
  })
}

function onAutoCompleteSelect(event, object) {
  $(event.target).val(object.item.value)
  $(event.target).parents('.object-property').find('input[name=value]').val('')
  objectMapper.getValueFromInput(event, __tab__.group)
  $(event.target).parents('.object-property').find('input[name=value]').select()
  $modalElement.find('form').trigger('change')
}

function setupOrderButtonEvents($modal, workspace, tab) {
  $modal.find('.increase-order').click(function() {
    workspace.moveGroup(workspace, tab.group, true)
  })

  $modal.find('.decrease-order ').click(function() {
    workspace.moveGroup(workspace, tab.group, false)
  })
}
