var resolve = require('resolve'); // npm install resolve --save-dev
const {execSync} = require('child_process');
const ClosureCompiler = require('google-closure-compiler').compiler;

//region public
module.exports = {
  compile,
  getClosureCompilerStringCommand
};


/**
 * @param {compilerOptions} options
 */
function compile(options) {
  mergeProperties(compilerOptions, options);
  let command = getClosureCompilerStringCommand(compilerOptions);
  console.log(command);
  execSync(command);
  console.log("closure compilation terminated");
}

//endregion


//region compiler options
//reference: https://developers.google.com/closure/compiler/docs/api-ref
/**
 *
 * @typedef {{config: {compilerFile: *}, language_in: string, language_out: string, warning_level: string, compilation_level: string, output_info: string, formatting: string, js: string, js_output_file: string, create_source_map: string, debug: boolean, module_resolution: string, output_module_dependencies: string}}
 */
let compilerOptions = {

  /**
   * by default, use compiler.jar installed by npm
   */
  compilerFile: resolve.sync('google-closure-compiler-java/compiler.jar'),

  process_common_js_modules: false,

  /**
   * ECMASCRIPT5
   * ECMASCRIPT5_STRICT
   * ECMASCRIPT6
   * ECMASCRIPT6_STRICT
   */
  language_in: 'ECMASCRIPT6',

  /**
   * ECMASCRIPT3
   * ECMASCRIPT5
   * ECMASCRIPT5_STRICT
   * ECMASCRIPT6
   * ECMASCRIPT6_STRICT
   */
  language_out: 'ECMASCRIPT5',

  /**
   * QUIET
   * DEFAULT
   * VERBOSE
   */
  warning_level: 'QUIET',

  /**
   * WHITESPACE_ONLY
   * SIMPLE_OPTIMIZATIONS
   * ADVANCED_OPTIMIZATIONS
   */
  compilation_level: 'ADVANCED_OPTIMIZATIONS',

  /**
   * compiled_code
   * warnings
   * errors
   * statistics
   */
  output_info: '',

  /**
   * pretty_print
   * print_input_delimiter
   */
  formatting: '',

  /**
   * input file to be compiled
   */
  js: '{{input_file}}',

  /**
   * output file name
   */
  js_output_file: '{{output_file}}',

  /**
   * tells the compiler if source map should be generated
   */
  create_source_map: '{{source_map_file}}',

  /**
   * names are not obfuscated
   */
  debug: false,

  /**
   * LEGACY
   * NODE
   * BROWSER
   *
   * Reference:
   * https://github.com/google/closure-compiler/wiki/JS-Modules
   */
  module_resolution: '',

  //manage_closure_dependencies: true,
  //only_closure_dependencies: true, // aka STRICT_MODE

  /*jscomp_error:'*',
  jscomp_warning:'unusedLocalVariables',
  jscomp_off:'strictMissingRequire',
  jscomp_off:'extraRequire',
  jscomp_off:'analyzerChecks',
  //*/

  output_module_dependencies: ''

  /**
   * not clear how to use it...
   */
  //js_module_root: '/node_modules/ /src/permissions/'
};
//endregion


//region helpers
function getClosureCompilerStringCommand(options) {
  /*
   An exemple of a closure compiler command

   let compilerCommand =
   'java -jar {{compilerFile}} \
   --warning_level {{warning_level}} \
   --compilation_level {{compilation_level}} \
   --language {{language_in}}\
   --language_out {{language_out}}\
   --js={{input_file}}\
   --js_output_file={{output_file}}';
   //*/
  let strCommand = 'java -jar ' + options.compilerFile;
  for (var method in options) {
    if (method != 'compilerFile') {
      if (typeof options[method] === 'boolean' && options[method] === true) {
        strCommand += ' --' + method;
      } else if (options[method].length > 0) {

        let values = options[method].split(' ');
        for (var value in values) {
          strCommand += ' --' + method + ' ' + values[value];
        }
      }
    }
  }
  return strCommand;
}


function mergeProperties(defaultProperties, modifiedProperties) {
  for (var m in modifiedProperties) {
    defaultProperties[m] = modifiedProperties[m];
  }
}

//endregion