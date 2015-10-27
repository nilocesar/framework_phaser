var fs = require('fs')
  , path = require('path')
  , _ = require('lodash')
  , exludePatterns = require('../src/js/app/properties').excludeFilePatterns
  , entityPathUtils = {}
  , beautifier = require('js-beautify').js_beautify
  , beautifyOptions =
    { indent_size: 2
    }

entityPathUtils.getList = function (modulePath) {

  function walk (dir) {
    var results = []
      , list = fs.readdirSync(dir)

    list.forEach(function(file) {
      file = path.resolve(dir, file)
      var stat = fs.statSync(file)

      if (stat && stat.isDirectory()) {
        results = results.concat(walk(file))
      } else {

        var containsExclude = false

        _.each(exludePatterns, function(pattern) {
          if (file.indexOf(pattern) !== -1) {
            containsExclude = true
          }
        })

        if (!containsExclude) {
          results.push(file)
        }
      }
    })

    return results
  }

  return walk(modulePath)
}

entityPathUtils.getEntityHash = function() {
  var entityList = entityPathUtils.getList(__dirname + '/../../src/js/game/entities')
    , hash = {}

  _.each(entityList, function(modulePath) {
    hash[getModuleNameFromPath(modulePath, 'entities', true)] = modulePath
  })

  return hash
}

function getImagesArray(excludeImages, subDirectory) {

  var directory = __dirname + '/../../src/images'

  if (subDirectory) {
    directory += path.sep + subDirectory
  }

  var imageList = entityPathUtils.getList(directory)
    , imageArray = []

  _.each(imageList, function(modulePath) {

    var imagePath = makeRelativeToWebRoot(modulePath)

    if (excludeImages && _.contains(excludeImages, imagePath)) {
      return
    }

    var path = modulePath.split('/')
      , container = path[path.length - 2]
      , isFromStaticFolder = container === 'static'
      , image =
        { path: imagePath
        , isStatic: isFromStaticFolder
        }

    imageArray.push(image)
  })

  return imageArray
}

function isTextureAtlas(url) {
  return /\.(?:json|xml)$/.test(url)
}

entityPathUtils.generateStaticIndex = function() {

  var indexFilename = __dirname + '/../../src/js/lib/static-entity-index.js'
    , staticIndex = {}

  // Add entities.
  staticIndex.entities = generateEntityData()

  // Add texture atlas files.
  staticIndex.textureAtlases = generateTextureAtlasData()

  var excludeImages = buildExcludeList(staticIndex.textureAtlases)

  // Add images, excluding any texture atlases.
  staticIndex.images = getImagesArray(excludeImages, '')

  // Parse into string, converting @ tokens.
  var jsonWithTokens = JSON.stringify(staticIndex)
    , parsedJson = 'module.exports = ' + jsonWithTokens.replace(/\"@|@\"/g, '')
    , beautifiedJs = beautifier(parsedJson, beautifyOptions).replace(/"/g, '\'')

  fs.writeFileSync(indexFilename, beautifiedJs)
}

function buildExcludeList(atlasData) {

  var list = []

  _.each(atlasData, function(atlas) {
    list.push(atlas.schema)
    list.push(atlas.image)
  })

  return list
}

function generateEntityData() {

  var entityPathIndex = entityPathUtils.getEntityHash()
    , entities = {}

  _.each(entityPathIndex, function(modulePath, name) {
    entities[name] = '@require(\'' + getRelativePath(modulePath)  + '\')@'
  })

  // Manually add the collision area, which is a utility stored away from custom user code.
  entities['collision-area'] = '@require(\'../../../editor/src/js/app/util/collision-area\')@'

  return entities
}

function extractAtlasData(imageList) {

  var atlases = []

  _.each(imageList, function(image) {

    // The boolean check on image is required as elements are removed, this prevents operating on undefined array elements.
    if (image && isTextureAtlas(image.path)) {
      var atlasData =
          { key: removeFileExtension(image.path)
          , schema: image.path
          , image: extractAtlasImageFromSchema(imageList, image.path)
          , isStatic: image.path.indexOf('static') >= 0 ? true : false
          }

      atlases.push(atlasData)
    }
  })

  return atlases
}

function extractAtlasImageFromSchema(imageList, atlasPath) {
  var matchingImages =  _.filter(imageList, function(image) {
    return !isTextureAtlas(image.path) && matchImagetoAtlasPath(image, atlasPath)
  })

  if (matchingImages.length < 1) {
    throw new Error('Atlas image can\'t be found for the atlas: ' + atlasPath)
  }

  if (matchingImages.length > 1) {
    throw new Error('Multiple atlases have been matched for the atlas: ' + atlasPath)
  }

  return matchingImages.pop().path
}

function matchImagetoAtlasPath(image, atlasPath) {
  return image.path.split('.').shift() === atlasPath.split('.').shift()
}

function generateTextureAtlasData() {
  return extractAtlasData(getImagesArray())
}

function makeRelativeToWebRoot(modulePath) {
  return modulePath.split('src').pop().replace(/\\/g, '/')
}

function getRelativePath(modulePath) {
  return '..' + modulePath.split(path.join('src','js')).pop().replace(/\\/g, '/')
}

function getModuleNameFromPath(directoryPath, splitOn, removeExtension) {

  var string = directoryPath.split(splitOn + path.sep).pop()

  if (removeExtension) {
    string = string.split('.').shift()
  }

  return string.replace(path.sep, '/')
}

function removeFileExtension(filePath) {
  return filePath.split('.').shift()
}

module.exports = entityPathUtils
