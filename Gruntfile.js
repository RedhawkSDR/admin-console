module.exports = function(grunt) {

  var htmlminProd = {
    collapseBooleanAttributes: false,
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeComments: true, // Only if you don't use comment directives!
    removeEmptyAttributes: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true
  };

  var distDir = 'dist';
  var myBanner = '\
 /*!                                                                                           \n\
  * This file is protected by Copyright. Please refer to the COPYRIGHT file                    \n\
  * distributed with this source distribution.                                                 \n\
  *                                                                                            \n\
  * This file is part of REDHAWK <%= pkg.name %>.                                              \n\
  *                                                                                            \n\
  * REDHAWK <%= pkg.name %> is free software: you can redistribute it and/or modify it         \n\
  * under the terms of the GNU Lesser General Public License as published by the               \n\
  * Free Software Foundation, either version 3 of the License, or (at your                     \n\
  * option) any later version.                                                                 \n\
  *                                                                                            \n\
  * REDHAWK <%= pkg.name %> is distributed in the hope that it will be useful, but WITHOUT     \n\
  * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or                      \n\
  * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License               \n\
  * for more details.                                                                          \n\
  *                                                                                            \n\
  * You should have received a copy of the GNU Lesser General Public License                   \n\
  * along with this program.  If not, see http://www.gnu.org/licenses/.                        \n\
  *                                                                                            \n\
  * <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>          \n\
  */                                                                                           \n\
 ';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bower: {
      dev: {
        options: {
          copy: false,
          install: true,
          cleanBowerDir: false
        }
      }
    },
    injector: {
      options: {
        addRootSlash: false
      },
      vendor: {
        options: {
          starttag: '<!-- build:{{ext}} lib/vendor.{{ext}} -->',
          endtag: '<!-- endbuild -->'
        },
        files: {
          'index.html': [ 'bower.json' ]
        }
      },
      deps: {
        options: {
          starttag: '<!-- build:{{ext}} {{ext}}/app.{{ext}} -->',
          endtag: '<!-- endbuild -->'
        },
        files: {
          'index.html': ['components/**/*.js', 'js/**/*.js', 'css/**/*.css']
        }
      }
    },

    clean: ['dist'],
    copy: {
      dist: {
        files: [
          {expand: true, src: ['index.html', 'images/**'], dest: distDir},
          {expand: true, cwd: 'bower_components/font-awesome/', src: 'font/**', dest: distDir},
          {expand: true, cwd: 'bower_components/bootstrap-css/', src: 'fonts/**', dest: distDir}
        ]
      },
      dev: {
        files: [
          {expand: true, cwd: 'bower_components/font-awesome/', src: 'font/**', dest: './'},
          {expand: true, cwd: 'bower_components/bootstrap-css/', src: 'fonts/**', dest: './'}
        ]
      }
    },
    useminPrepare: {
      html: 'index.html',
      options: {
        dest: distDir
      }
    },
    ngtemplates:  {
      comp: {
        src: 'views/**/*.html',
        dest: distDir+ '/js/views-tpls.js',
        options: {
          module: 'webSCA',
          usemin: distDir + '/js/app.js',
          htmlmin: htmlminProd
        }
      },
      views: {
        src: 'components/**/*.html',
        dest: distDir + '/js/components-tpls.js',
        options: {
          module: 'webSCA',
          usemin: distDir + '/js/app.js',
          htmlmin: htmlminProd
        }
      }
    },
    usemin: {
      html: distDir + '/index.html'
    },
    uglify: {
      options: {
          report: 'min',
          mangle: false,
          preserveComments: 'some'
      }
    },
    concat: {
      options: {
        stripBanners: false,
        banner: myBanner
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-injector');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-angular-templates');

  grunt.registerTask('default', ['bower:dev', 'copy:dev', 'injector:vendor', 'injector:deps']);
  grunt.registerTask('dist', ['clean', 'copy:dist', 'bower', 'useminPrepare', 'ngtemplates', 'concat', 'cssmin', 'uglify', 'usemin']);
};