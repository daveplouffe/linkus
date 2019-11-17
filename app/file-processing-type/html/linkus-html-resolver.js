const eventbus = require('../../helpers/eventbus');
const LinkusEvent = require('../app/linkus-event');
const JsImportResolver = require('../../core/js-import-resolver');

(function () {

  let srciptTag = /<script.*src="(.*)"/gmi;

  eventbus.on(LinkusEvent.onResolve, function (linkus) {
    if (linkus.context.entry.extension === '.html') {
      linkus.context.dependencyOrder = resolveScss(linkus.context.entry.file);
    }
  });

  /**
   * @param {string} entry - absolute file path
   * @return {Array} - dependency order
   */
  function resolveScss(entry) {
    let resolver = JsImportResolver.make({
      regexImports: srciptTag,
    });
    return resolver.getDependencyOrder(entry);
  }

})();


