const eventbus = require('../../helpers/eventbus');
const LinkusEvent = require('../../core/linkus-event');
const ClosureCompiler = require('../../helpers/closure-compiler');

/*
 {
compile: args.compile,
isDebug: args.compileDebug,
compilationLevel: args.compilationLevel}
)
 */
eventbus.on(LinkusEvent.onCompile, function (linkus) {
  if (linkus.context.entry.extension === '.js' && linkus.props.compile.enabled) {
    let fileParts = linkus.context.outputParts;
    if(linkus.context.state !== 'NO_CHANGE') {
      let outputFile = fileParts.path + fileParts.fileName + '.' + linkus.context.version + '.min' + fileParts.extension;
      doCompilation(linkus, fileParts.file, outputFile);
    } else {
      if(!linkus.cached.isOutputCompilationExist()) {
        doCompilation(linkus, linkus.cached.getOutput(), linkus.cached.getCompiledOutputFileName());
      }
    }
  }
});

function doCompilation(linkus, entryfile, outputfile) {
  ClosureCompiler.compile({
    process_common_js_modules: linkus.props.compile.process_common_js_modules,
    module_resolution: linkus.props.compile.module_resolution,
    formatting: '',
    js: entryfile,
    compilation_level: linkus.props.compile.compilationLevel,
    js_output_file: outputfile,
    create_source_map: outputfile + '.map',
    debug: linkus.props.compile.isDebugMode
  });
}