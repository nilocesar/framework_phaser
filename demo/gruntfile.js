var properties = require('./src/js/game/properties')
  , editorProperties = require('./editor/src/js/app/properties')
  , entityPathUtils = require('./editor/util/entity-path-utils')

module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-cache-bust')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-compress')
  grunt.loadNpmTasks('grunt-contrib-connect')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-jade')
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-contrib-stylus')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-open')
  grunt.loadNpmTasks('grunt-pngmin')
  grunt.loadNpmTasks('grunt-express')
  grunt.loadNpmTasks('grunt-mkdir')
  grunt.loadNpmTasks('grunt-notify')

  var productionBuild = grunt.cli.tasks.length && grunt.cli.tasks[0] === 'build'
    , gameLiveReload = productionBuild ? false : properties.liveReloadPort
    , editorLiveReload = productionBuild ? false : editorProperties.liveReloadPort

  grunt.initConfig(
    { pkg: grunt.file.readJSON('package.json')

    , project:
      { src: 'src/js'
      , js: '<%= project.src %>/game/{,*/}*.js'
      , dest: 'build/js'
      , bundle: 'build/js/app.min.js'
      , port: properties.port
      , bundleKey: '501f769facb1293c7a544dc12e6555c8:'
      , banner:
        '/*!\n' +
        ' * <%= pkg.title %>\n' +
        ' * <%= pkg.description %>\n' +
        ' * <%= pkg.url %>\n' +
        ' * @author <%= pkg.author %>\n' +
        ' * @version <%= pkg.version %>\n' +
        ' * Copyright <%= pkg.author %>. <%= pkg.license %> licensed.\n' +
        ' * Made using Phaser Blank <https://github.com/lukewilde/phaser-blank/>\n' +
        ' */\n'
      }

    , express:
      { server:
        { options:
          { port: '<%= project.port %>'
          , bases: ['./build']
          , server: productionBuild ? false : './editor/util/server.js'
          }
        }
      }

    , jshint:
      { files:
        [ 'gruntfile.js'
        , '<%= project.js %>'
        , 'editor/src/js/app/{,*/}*.js'
        ]
      , options:
        { jshintrc: '.jshintrc'
        }
      }

    , watch:
      { js:
        { files: '<%= project.dest %>/**/*.js'
        , tasks: ['jade:game']
        , options: { livereload: gameLiveReload }
        }
      , entities:
        { files: 'src/js/game/entities/**/*'
        , tasks: ['staticEntityIndex']
        }
      , editorJs:
        { files: 'editor/build/js/app.min.js'
        , options: { livereload: editorLiveReload }
        }
      , editorStylus:
        { files: 'editor/src/style/*.styl'
        , tasks: ['stylus:editor']
        , options: { livereload: editorLiveReload }
        }
      , gameStylus:
        { files: 'src/style/*.styl'
        , tasks: ['stylus:game']
        , options: { livereload: gameLiveReload }
        }
      , editorJade:
        { files: 'editor/src/templates/**/*'
        , tasks: ['jade:editor', 'browserify:editor']
        , options: { livereload: editorLiveReload }
        }
      , gameJade:
        { files: 'src/templates/*.jade'
        , tasks: ['jade:game']
        , options: { livereload: gameLiveReload }
        }
      , images:
        { files: 'src/images/**/*'
        , tasks: ['copy:images', 'staticEntityIndex']
        , options: { livereload: gameLiveReload }
        }
      , editorImages:
        { files: 'editor/src/images/**/*'
        , tasks: ['copy:editorImages']
        , options: { livereload: editorLiveReload }
        }
      , audio:
        { files: 'src/audio/**/*'
        , tasks: ['copy:audio']
        , options: { livereload: gameLiveReload }
        }
      , server:
        { files: 'editor/util/*'
        , tasks: ['express']
        , options: { livereload: gameLiveReload }
        }
      }

    , browserify:
      { game:
        { src: ['<%= project.src %>/game/startup.js']
        , dest: '<%= project.bundle %>'
        , options:
          { transform: ['browserify-shim', 'jadeify']
          , watch: true
          , browserifyOptions:
            { debug: !productionBuild
            }
          }
        }
      , editor:
        { src: ['editor/src/js/app/startup.js']
        , dest: 'editor/build/js/app.min.js'
        , options:
          { transform: ['browserify-shim', 'jadeify']
          , watch: true
          , browserifyOptions:
            { debug: true
            }
          }
        }
      }

    , open:
      { server:
        { path: 'http://localhost:<%= project.port %>'
        }
      }

    , cacheBust:
      { options:
        { encoding: 'utf8'
        , algorithm: 'md5'
        , length: 8
        }
      , assets:
        { files:
          [ { src:
              [ 'build/index.html'
              , '<%= project.bundle %>'
              ]
            }
          ]
        }
      }

    , jade:
      { editor:
        { options:
          { data:
            { properties: editorProperties
            , liveReloadPort: editorProperties.liveReloadPort
            , productionBuild: productionBuild
            }
          }
        , files:
          { 'editor/build/index.html': ['editor/src/templates/index.jade']
          }
        }
      , game:
        { options:
          { data:
            { properties: properties
            , productionBuild: productionBuild
            }
          }
        , files:
          { 'build/index.html': ['src/templates/index.jade']
          }
        }
      }

    , stylus:
      { game:
        { files:
          { 'build/style/index.css': ['src/style/index.styl'] }
        , options:
          { sourcemaps: !productionBuild
          }
        }
      , editor:
        { files:
          { 'editor/build/style/index.css': ['editor/src/style/index.styl'] }
        , options:
          { sourcemaps: !productionBuild
          }
        }
      }

    , clean:
      { build: ['./build/']
      , distribution:
        [ './distribution/'
        , './editor/build/'
        ]
      , demo:
        [ './distribution/phaser-le/src/images/*'
        , './distribution/phaser-le/src/js/game/entities/*'
        , './distribution/phaser-le/src/js/game/levels/*'
        , './distribution/phaser-le/src/js/game/states/level*.js'
        , './distribution/phaser-le/src/js/game/util'
        ]
      , blankFiles:
        [ './distribution/demo/src/js/game/states/level1-blank.js'
        , './distribution/demo/src/js/game/startup-blank.js'
        , './distribution/phaser-le/src/js/game/startup-blank.js'
        ]
      }

    , pngmin:
      { options:
        { ext: '.png'
        , force: true
        }
      , compile:
        { files:
          [ { src: 'src/images/*.png'
            , dest: 'src/images/'
            }
          ]
        }
      }

    , copy:
      { images:
        { files:
          [ { expand: true, cwd: 'src/images/', src: ['**'], dest: 'build/images/' }
          ]
        }
      , editorImages:
        { files:
          [ { expand: true, cwd: 'editor/src/images/', src: ['**'], dest: 'editor/build/images/' }
          ]
        }
      , audio:
        { files:
          [ { expand: true, cwd: 'src/audio/', src: ['**'], dest: 'build/audio/' }
          ]
        }
      , fonts:
        { files:
          [ { expand: true, cwd: 'src/fonts/', src: ['**'], dest: 'build/fonts/' }
          ]
        }
      , distributionDemo:
        { files:
          [ { expand: true, cwd: 'editor/', src: ['**'], dest: 'distribution/demo/editor/' }
          , { expand: true, cwd: '.', src: ['*'],  dest: 'distribution/demo/', filter: 'isFile' }
          , { expand: true, cwd: 'src/', src: ['**'], dest: 'distribution/demo/src' }
          ]
        }
      , distributionClean:
        { files:
          [ { expand: true, cwd: 'distribution/demo/', src: ['**'], dest: 'distribution/phaser-le' }
          ]
        }
      , blankFiles:
        { files:
          [ { cwd: '.', src: './distribution/demo/src/js/game/states/level1-blank.js' , dest: './distribution/phaser-le/src/js/game/states/level1.js' }
          , { cwd: '.', src: './distribution/demo/src/js/game/startup-blank.js' , dest: './distribution/phaser-le/src/js/game/startup.js' }
          ]
        }
      }

    , mkdir:
      { levelPath:
        { options:
          { create: ['./src/js/game/levels'] }
        }
      , distribution: ['./distribution']
      , staticImages:
        { options:
          { create: ['./distribution/phaser-le/src/images/static'] }
        }
      }

    , uglify:
      { options:
        { banner: '<%= project.banner %>'
        }
      , game:
        { files:
          { '<%= project.bundle %>': '<%= project.bundle %>'
          }
        }
      , editor:
        { files:
          { 'editor/build/js/app.min.js': 'editor/build/js/app.min.js'
          }
        }
      }

    , compress:
      { options:
        { archive: 'build/build.zip'
        }
      , main:
        { files: [ { expand: true, cwd: 'build/', src: ['**/*'], dest: 'build/' } ]
        }
      }
    }
  )

  grunt.registerTask('default',
    [ 'clean:build'
    , 'staticEntityIndex'
    , 'browserify'
    , 'jade'
    , 'stylus'
    , 'copy:images'
    , 'copy:editorImages'
    , 'copy:audio'
    , 'copy:fonts'
    , 'mkdir:levelPath'
    , 'express'
    , 'open'
    , 'watch'
    ]
  )

  grunt.registerTask('buildEditor',
    [ 'clean:build'
    , 'staticEntityIndex'
    , 'browserify'
    , 'uglify:editor'
    , 'jade'
    , 'stylus'
    , 'copy:images'
    , 'copy:editorImages'
    , 'copy:audio'
    , 'copy:fonts'
    , 'mkdir:levelPath'
    , 'express'
    , 'open'
    , 'watch'
    ]
  )

  grunt.registerTask('build',
    [ /*'jshint'
    , */'clean:build'
    , 'staticEntityIndex'
    , 'browserify:game'
    , 'jade:game'
    , 'stylus:game'
    , 'uglify:game'
    , 'copy:images'
    , 'copy:audio'
    , 'copy:fonts'
    , 'cacheBust'
    , 'express'
    , 'open'
    , 'watch'
    ]
  )

  grunt.registerTask('publish',
    [ /*'jshint'
    , */'clean:build'
    , 'browserify:game'
    , 'jade:game'
    , 'stylus:game'
    , 'uglify:game'
    , 'copy:images'
    , 'copy:audio'
    , 'copy:fonts'
    , 'cacheBust'
    , 'open'
    ]
  )

  grunt.registerTask('dist',
    [ /*'jshint'
    , */'clean:distribution'
    , 'mkdir:distribution'
    , 'copy:distributionDemo'
    , 'copy:distributionClean'
    , 'clean:demo'
    , 'copy:blankFiles'
    , 'clean:blankFiles'
    , 'mkdir:staticImages'
    ]
  )

  grunt.registerTask('staticEntityIndex', 'Create an entity index that allows front end code to dynamically access entities.', entityPathUtils.generateStaticIndex)

  grunt.registerTask('optimise', ['pngmin', 'copy:images'])
}
