module.exports = function (grunt) {
  'use strict';

  var gruntConfig = {
    pkg: grunt.file.readJSON('package.json')
  };

  // Test
  grunt.loadNpmTasks('grunt-contrib-qunit');
  gruntConfig.qunit = {
    src: ['test/index.html'],
    serve: { options: { urls: ['http://localhost:8082/test/index.html']}},
    bundle: ['output/bundle/test/index.html']
  };

  // Continuous integration
  grunt.registerTask('ci', ['qunit:src']);

  // grunt
  grunt.initConfig(gruntConfig);
};
