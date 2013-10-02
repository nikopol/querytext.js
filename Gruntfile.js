module.exports = function(grunt) {

  // Load QUnit plugin
  grunt.loadNpmTasks('grunt-contrib-qunit');

  grunt.initConfig({
    qunit: {
      all: ['test/**/*.html']
    }
  });

  // Run tests
  grunt.registerTask('test', ['qunit:all']);
  grunt.registerTask('travis', ['test']);
};
