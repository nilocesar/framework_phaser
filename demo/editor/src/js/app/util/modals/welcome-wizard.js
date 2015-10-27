var welcomeWizardTemplate = require('../../../../templates/modals/welcome-wizard.jade')
  , modal = require('modal')

module.exports = function () {
  var modalOptions =
      { title: ''
      , overlayClassName: 'welcome-wizard'
      , content: $(welcomeWizardTemplate())
      , buttons: []
      }

  //get the current date
  var currentDate = new Date()

  //get the previously opened date
  var lastOpenedDay = localStorage.getItem('currentDay')
    , lastOpenedMonth = localStorage.getItem('currentMonth')

  //open the welcome wizard if we have not been opened today
  if(currentDate.getDate() > lastOpenedDay || currentDate.getMonth() > lastOpenedMonth) {
    //open the modal
    modal(modalOptions)
    //retrieve the modal content from the online source
    $.get('http://phaserle.com/wp-content/themes/phaser-le/welcome-wizard.php', function(content) {
      $('.welcome-wizard h2').text('')
      $('.content').html(content)
    }).error(function () {
      $('.welcome-wizard h2').text('Eep')
      $('.content').html('<p>There appears to be a problem with your network connection!</p>')
    })
  }

  //save the new last opened date.
  localStorage.setItem('currentDay', currentDate.getDate())
  localStorage.setItem('currentMonth', currentDate.getMonth())
}
