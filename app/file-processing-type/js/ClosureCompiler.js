const resolve = require('resolve'); // npm install resolve --save-dev
const {execSync} = require('child_process');

/**
 * @param {string} entry
 * @param {string} output
 * @param {{}} options
 * @param {string?} options.compilation_level BUNDLE, WHITESPACE_ONLY, SIMPLE (default), ADVANCED
 * @param {boolean?} options.isDebugMode default: false
 * @param {boolean?} options.sourcemap default: false
 * @param {string?} options.language_in ECMASCRIPT3, ECMASCRIPT5, ECMASCRIPT5_STRICT, ECMASCRIPT_2015, ECMASCRIPT_2016, ECMASCRIPT_2017, ECMASCRIPT_2018, ECMASCRIPT_2019, ECMASCRIPT_2020,ECMASCRIPT_2021, STABLE, ECMASCRIPT_NEXT (latest features supported) (default: STABLE)
 * @param {string?} options.language_out ECMASCRIPT3, ECMASCRIPT5, ECMASCRIPT_2015, ECMASCRIPT_2016, ECMASCRIPT_2017, ECMASCRIPT_2018, ECMASCRIPT_2019, ECMASCRIPT_2020, ECMASCRIPT_2021, STABLE, ECMASCRIPT_NEXT (latest features supported) (default: ECMASCRIPT_NEXT)
 * @param {string?} options.warning_level QUIET | DEFAULT | VERBOSE (default: QUIET)
 * @param {string?} options.formatting PRETTY_PRINT | PRINT_INPUT_DELIMITER | SINGLE_QUOTES
 * @param {boolean?} options.generate_exports Generates export code for those marked with @export (default: true)
 */
module.exports = function(entry, output, options) {
  options = Object.assign({
    isDebugMode:false,
    compilation_level: 'SIMPLE',
    warning_level: 'QUIET'
  }, options);
  const compilerFile = resolve.sync('google-closure-compiler-java/compiler.jar')
  const command = `
  java -jar ${compilerFile}
 --compilation_level ${options.compilation_level}
 --js ${entry}
 --js_output_file ${output}
 ${options.isDebugMode ? '--debug':''}
 ${options.formatting ? '--formatting '+options.formatting: ''}
 ${options.generate_exports ? '--generate_exports':''}
 ${options.sourcemap ? '--create_source_map ' + output + '.map':''}
 ${options.warning_level ? '--warning_level ' + options.warning_level: ''}
 ${options.language_in ? '--language_in ' + options.language_in: ''}
 ${options.language_out ? '--language_out ' + options.language_out: ''}
 `;
  console.log('\x1b[32m'+command.replace(/[\n ]{2,}/g,'\n')+'\x1b[0m');
  execSync(command.replace(/\s+/g,' '));
}