var Phaser = require('Phaser')
  , _ = require('lodash')
  , MathUtils = require('MathUtils')
  , editorProperties = require('editor-properties')

  , showCreateGroupModal = require('./create-group-modal')
  , showGroupOptionModal = require('./show-group-inspection-modal')

  // Instance variables.
  , workspace = null
  , GroupManager = null
  , tabs = null
  , addTabButton = null
  , showButton
  , hideButton
  , bg
  , label
  , scrollbarGroup
  , scrollbarSlider
  , instructions

  , draggingTab = null
  , tabGroups = []
  , tabMaxY
  , tabMinY
  , previousTabYPos
  , mouseYDis
  , endID
  , groupMask

  , fontStyle = { font: 'bold 14px Arial', fill: 'black', align: 'left' }

  , isDraggingGroup

  , initalX = 0
  , tabPos =
    { y: 110
    , x: initalX
    }

GroupManager = function (game, parent) {
  Phaser.Plugin.call(this, game, parent)
}

GroupManager.prototype = Object.create(Phaser.Plugin.prototype)
GroupManager.prototype.constructor = GroupManager

GroupManager.prototype.init = function (_workspace) {

  //add background
  bg = this.game.add.tileSprite(this.game.width-245, 0, 245, this.game.height, 'editorAtlas', 'side-panel.png')
  bg.fixedToCamera = true

  addScrollbar(this.game)

  //add label
  label = this.game.add.text(this.game.width-195,40, 'Groups', { font: 'bold 38px Arial', fill: 'white', align: 'left' })
  label.fixedToCamera = true

  instructions = this.game.add.text(this.game.width-195, 90, 'Group order sets z-index priority.\n Higher is better.', { font: '9px Arial', fill: 'white', align: 'center' })
  instructions.fixedToCamera = true

  //create hide and show buttons
  showButton = this.game.add.button(this.game.width-24, 40, 'editorAtlas', show, this, 'open-tab.png', 'open-tab.png', 'open-tab.png', 'open-tab.png')
  showButton.input.useHandCursor = true
  showButton.fixedToCamera = true
  showButton.visible = false

  hideButton = this.game.add.button(this.game.width-268, 40, 'editorAtlas', hide, this, 'close-tab.png', 'close-tab.png', 'close-tab.png', 'close-tab.png')
  hideButton.input.useHandCursor = true
  hideButton.fixedToCamera = true

  workspace = _workspace
  workspace.events.groupsSet.add(this.refreshGroups, this)
  workspace.events.groupRemoved.add(this.refreshGroups, this)
  workspace.events.activeGroupChanged.add(setActiveGroup)
  workspace.events.deletedSelection.add(clearSelections)
  workspace.events.inputPriorityReset.add(updateInputPriority, this)

  this.refreshGroups()
  workspace.setActiveGroup(workspace.groups[0])

  isDraggingGroup = false

  $(window).resize(_.bind(resizeGame, this))
}

function clearSelections() {
  tabs.forEach(function(tab) {
    if (workspace.getActiveGroup().name !== tab.name) {
      tab.sprite.frameName = 'group-idle.png'
    }
  }, this)
}

function updateInputPriority() {
  //when the input priority order changes, make sure that the group manager is always on top.
  _.each(tabs, function(tab) {
    tab.sprite.input.priorityID = ++workspace.priorityID
    tab.sprite.input.priorityID = ++workspace.priorityID
    tab.optionsButton.input.priorityID = ++workspace.priorityID
    tab.lockButton.input.priorityID = ++workspace.priorityID
    tab.unlockButton.input.priorityID = ++workspace.priorityID
    tab.showButton.input.priorityID = ++workspace.priorityID
    tab.hideButton.input.priorityID = ++workspace.priorityID
  }, this)

  showButton.input.priorityID = ++workspace.priorityID
  hideButton.input.priorityID = ++workspace.priorityID
  addTabButton.input.priorityID = ++workspace.priorityID
}

function resizeGame() {
  label.fixedToCamera = false
  label.x = this.game.width-195
  label.y = 50
  label.fixedToCamera = true

  showButton.fixedToCamera = false
  showButton.x = this.game.width-24
  showButton.y = 40
  showButton.fixedToCamera = true

  instructions.fixedToCamera = false
  instructions.x = this.game.width-205
  instructions.y = 100

  hideButton.fixedToCamera = false
  hideButton.x = this.game.width-268
  hideButton.y = 40
  hideButton.fixedToCamera = true

  bg.fixedToCamera = false
  bg.x = this.game.width-245
  bg.y = 0
  bg.fixedToCamera = true

  scrollbarGroup.destroy()

  addScrollbar(this.game)

  this.refreshGroups()
}

function addScrollbar(game) {

  scrollbarGroup = game.add.group()
  scrollbarGroup.fixedToCamera = true

  var scrollbarBg = game.add.tileSprite(game.width-15, 52, 12, game.height-165, 'editorAtlas', 'scrollbar-mid.png')
  scrollbarGroup.add(scrollbarBg)

  var scrollbarBgTopEnd = game.add.image(game.width-3, 52, 'editorAtlas', 'scrollbar-end.png')
  scrollbarGroup.add(scrollbarBgTopEnd)
  scrollbarBgTopEnd.rotation = MathUtils.toRadians(180)

  var scrollbarBgBottomEnd = game.add.image(game.width-15, game.height-113, 'editorAtlas', 'scrollbar-end.png')
  scrollbarGroup.add(scrollbarBgBottomEnd)

  scrollbarSlider = game.add.sprite(game.width-13, 47, 'editorAtlas', 'scrollbar-button.png')
  scrollbarGroup.add(scrollbarSlider)

  scrollbarSlider.events.onDragStart.add(handleDragGroupStart, this)
  scrollbarSlider.events.onDragStop.add(handleDragGroupStop, this)
}

// Show the group panel.
function show() {
  showButton.visible = false
  hideButton.visible = true
  instructions.visible = true
  bg.visible = true
  scrollbarGroup.visible = true
  label.visible = true
  addTabButton.visible = true

  _.forEach(tabs, function(tab) {
    tab.tabGroup.visible = true
  }, this)

  editorProperties.groupPalleteIsOpen = true
}

// Hide the group panel.
function hide() {
  showButton.visible = true
  instructions.visible = false
  hideButton.visible = false
  label.visible = false
  addTabButton.visible = false
  scrollbarGroup.visible = false
  bg.visible = false

  _.forEach(tabs, function(tab) {
    tab.tabGroup.visible = false
  }, this)

  editorProperties.groupPalleteIsOpen = false
}

GroupManager.prototype.isOpen = function() {
  return hideButton.visible
}

GroupManager.prototype.refreshGroups = function () {
  // Remove the existing group graphic data.
  resetGraphics()

  // Setup a mask for the groups.
  groupMask = this.game.add.graphics(this.game.width-245, Math.round(128/32) * 32)
  groupMask.beginFill(0xFF3300)
  groupMask.drawRect(0, 0, 245, (this.game.height-280))
  groupMask.endFill()
  groupMask.fixedToCamera = true

  // Initial settings
  tabGroups = []
  initalX = this.game.width - 238
  tabPos.x = initalX
  tabPos.y = tabMinY = Math.round(128/32) * 32

  // Add all the group tabs.
  var id = 0
  _.forEachRight(workspace.groups, function(group) {
    if (group.name !== 'collisions') {

      // Set the max tab pos
      tabMaxY = tabPos.y
      this.addGroupButton(group, id )
      id ++
    }
  }, this)

  // Add the button for the collision layer last
  this.addGroupButton(workspace.getGroupByName('collisions'), id )

  // Add the new group button
  drawAddGroupbutton.call(this)

  // Activate the scrollbar if we need it.
  checkIfScrollbarRequired(this.game)
}

GroupManager.prototype.addGroupButton = function(group, id) {
  var tab =
      { sprite: this.game.add.sprite(tabPos.x, 0, 'editorAtlas', 'group-idle.png')
      , text: this.game.add.text(0,2, group.name, fontStyle)
      , optionsButton: this.game.add.button(this.game.width-40, 2, 'editorAtlas', openGroupSettings, this, 'group-settings-cog-button.png', 'group-settings-cog-button-hover.png', 'group-settings-cog-button-hover.png', 'group-settings-cog-button-hover.png')
      , lockButton: this.game.add.button(this.game.width-64, 2, 'editorAtlas', unlockGroup, this, 'group-locked.png', 'group-locked.png', 'group-locked.png', 'group-locked.png')
      , unlockButton: this.game.add.button(this.game.width-64, 2, 'editorAtlas', lockGroup, this, 'group-unlocked.png', 'group-unlocked.png', 'group-unlocked.png', 'group-unlocked.png')
      , showButton: this.game.add.button(this.game.width-90, 4, 'editorAtlas', showGroup, this, 'invisible-tab.png', 'invisible-tab.png', 'invisible-tab.png', 'invisible-tab.png')
      , hideButton: this.game.add.button(this.game.width-90, 4, 'editorAtlas', hideGroup, this, 'visible-tab.png', 'visible-tab.png', 'visible-tab.png', 'visible-tab.png')
      , name: group.name
      , group: group
      , tabGroup: this.game.add.group()
      , id: id
      , orgY: tabPos.y
      }

  centerTabText(tab)
  tab.text.fixedToCamera = true

  tab.unlockButton.tab = tab.lockButton.tab = tab.optionsButton.tab = tab.sprite.tab = tab.tabGroup.tab = tab.showButton.tab = tab.hideButton.tab = group.tab = tab
  tab.unlockButton.fixedToCamera = tab.lockButton.fixedToCamera = tab.optionsButton.fixedToCamera = tab.showButton.fixedToCamera = tab.hideButton.fixedToCamera = true
  tab.unlockButton.useHandCursor = tab.lockButton.useHandCursor = tab.optionsButton.useHandCursor = tab.showButton.useHandCursor = tab.hideButton.useHandCursor = true
  tab.lockButton.visible = false
  tab.showButton.visible = false

  tab.sprite.fixedToCamera = true
  tab.sprite.inputEnabled = true

  tab.hideButton.scale.x = tab.hideButton.scale.y = .8
  tab.showButton.scale.x = tab.showButton.scale.y = .8

  tab.sprite.input.useHandCursor = true

  tab.tabGroup.add(tab.sprite)
  tab.tabGroup.add(tab.text)
  tab.tabGroup.add(tab.optionsButton)
  tab.tabGroup.add(tab.lockButton)
  tab.tabGroup.add(tab.unlockButton)
  tab.tabGroup.add(tab.showButton)
  tab.tabGroup.add(tab.hideButton)
  tab.tabGroup.y = tabPos.y

  tab.tabGroup.mask = groupMask

  tab.sprite.events.onInputUp.add(function() {
    tab.sprite.frameName = 'group-active.png'
    workspace.setActiveGroup(tab.group)
    draggingTab = null
  })

  tab.sprite.events.onInputDown.add(this.dragTab, this)

  tab.sprite.events.onInputOver.add(function(sprite) {
    group.forEach(function(entity) {
      if (entity.drawHighlightRect) {
        entity.drawHighlightRect(0.5)
      }
    })

    if (sprite.frameName !== 'group-active.png') {
      sprite.frameName = 'group-hover.png'
    }
  })

  tab.sprite.events.onInputOut.add(function(sprite) {
    group.forEach(function(entity) {
      if (entity.highlightGraphics) {
        entity.highlightGraphics.clear()
      }
    })

    if (sprite.frameName !== 'group-active.png') {
      sprite.frameName = 'group-idle.png'
    }
  })

  if (tab.group === workspace.getActiveGroup()) {
    tab.sprite.frameName = 'group-active.png'
  }

  tabPos.y += tab.sprite.height + 10
  tabPos.y = Math.round(tabPos.y/32) * 32

  tabs.push(tab)
  tabGroups.push(tab.tabGroup)
}

function checkIfScrollbarRequired(game) {
  // We can calulate this mathematically, as the default group and collisions group (2 in total) === 55px
  if (tabs.length >= 11) {
    scrollbarSlider.inputEnabled = true
    scrollbarSlider.input.useHandCursor = true
    scrollbarSlider.input.enableDrag(false, false, false, 255, new Phaser.Rectangle(game.width-13, 47, scrollbarSlider.width, game.height-155))
    scrollbarSlider.input.setDragLock(false, true)
  } else {
    scrollbarSlider.alpha = .5
  }
}

function handleDragGroupStart() {
  isDraggingGroup = true
}

function handleDragGroupStop() {
  isDraggingGroup = false
}

function hideGroup(e) {
  e.tab.showButton.visible = true
  e.tab.hideButton.visible = false
  e.tab.group.visible = false

  // Loop through and hide any associated collision area overlays.
  e.tab.group.forEach(function(entity) {
    if (entity.toggleVisibility) {
      entity.toggleVisibility()
    }
  }, this)
}

function showGroup(e) {
  e.tab.showButton.visible = false
  e.tab.hideButton.visible = true
  e.tab.group.visible = true

  // Loop through and show any associated collision area overlays.
  e.tab.group.forEach(function(entity) {
    if (entity.toggleVisibility) {
      entity.toggleVisibility()
    }
  }, this)
}

GroupManager.prototype.dragTab = function(e) {
  if (draggingTab || e.tab.group.name === 'collisions') {
    return
  }

  e.tab.tabGroup.fixedToCamera = false
  draggingTab = e.tab
  endID = draggingTab.id
  previousTabYPos = draggingTab.tabGroup.y

  mouseYDis = this.game.input.mousePointer.y - e.tab.tabGroup.y
}

GroupManager.prototype.update = function() {

  if (draggingTab) {

    var targetY = Math.round((this.game.input.mousePointer.y+tabMinY-mouseYDis) /32) * 32
    targetY -= tabMinY

    if (targetY >= tabMaxY) {
      targetY = tabMaxY
    }

    if (targetY < tabMinY) {
      targetY = tabMinY
    }

    //check to see if we are now on top of another tab
    var movedGroup = _.find(tabGroups, { 'y': targetY })
    if (movedGroup && movedGroup !== draggingTab.tabGroup) {
      movedGroup.y = previousTabYPos
      draggingTab.tabGroup.y = targetY
      previousTabYPos = targetY
      endID = movedGroup.tab.id

      workspace.container.swap(draggingTab.group, movedGroup.tab.group)

      workspace.orderGroups()
    }
  }

  if (isDraggingGroup) {
    _.forEach(tabGroups, function(tabGroup) {
      tabGroup.y = tabGroup.tab.orgY - ((scrollbarSlider.y-47) / (this.game.height-280) * (tabPos.y - (this.game.height-320)))
    }, this)
  }
}

function openGroupSettings(e) {
  $('.inspector').remove()
  showGroupOptionModal(workspace, e.tab)
  setActiveGroup(e.tab.name)
}

function lockGroup(e) {
  e.tab.lockButton.visible = true
  e.tab.unlockButton.visible = false

  workspace.lockGroup(e.tab.group)
}

function unlockGroup(e) {
  e.tab.lockButton.visible = false
  e.tab.unlockButton.visible = true

  workspace.lockGroup(e.tab.group)
}

function centerTabText(tab) {
  tab.text.x = tab.sprite.x + 16
}

function resetGraphics() {
  _.each(tabs, function(tab) {
    tab.sprite.destroy()
    tab.text.destroy()
    tab.optionsButton.destroy()
    tab.lockButton.destroy()
    tab.unlockButton.destroy()
    tab.showButton.destroy()
    tab.hideButton.destroy()
    tab.tabGroup.destroy()
  })

  if (addTabButton) {
    addTabButton.destroy()
  }

  tabs = []

  if (groupMask) {
    groupMask.destroy()
  }

  scrollbarSlider.y = 47
}

function drawAddGroupbutton() {
  addTabButton = this.game.add.button(tabPos.x + 35, this.game.height-136, 'editorAtlas', handleAddGroup, this, 'add-group-hover.png', 'add-group.png', 'add-group-hover.png', 'add-group-hover.png')
  addTabButton.fixedToCamera = true
  addTabButton.input.useHandCursor = true
}

function handleAddGroup() {
  showCreateGroupModal.call(this, workspace)
}

function setActiveGroup(groupName) {
  _.each(tabs, function(tab) {
    tab.sprite.frameName = 'group-idle.png'
  })

  var activeTab = _.find(tabs, { name: groupName })

  if (activeTab) {
    activeTab.sprite.frameName = 'group-active.png'
  }
}

module.exports = GroupManager
