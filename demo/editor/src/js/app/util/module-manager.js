var moduleManager = {}
  , moduleList = require('../../../../../src/js/lib/static-entity-index')

moduleManager.create = function (moduleId, game, x, y) {
  return new moduleList.entities[moduleId](game, x, y)
}

moduleManager.getList = function () {
  return moduleList.entities
}

module.exports = moduleManager
