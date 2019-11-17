/**
 * @type {{onBeforeBuild: string, onBeforeResolve: string, onResolve: string, onResolveDone: string, onMakeOutput: string, onBeforeWriteContentToOutput: string, onOutputDone: string, onBeforeCompile: string, onCompile: string, onCompileDone: string, onBuildDone: string}}
 */
const LinkusEvent = {

  /**
   * {Linkus}
   */
  onBeforeBuild: 'linkus-on-before-build',

  /**
   * {Linkus}
   */
  onBeforeResolve: 'linkus-on-before-resolve',

  /**
   * {Linkus}
   */
  onResolve: 'linkus-on-resolve',

  /**
   * {Linkus}
   */
  onResolveDone: 'linkus-on-resolve-done',

  /**
   * {Linkus}
   */
  onMakeOutput: 'linkus-on-make-output',

  /**
   * {Linkus}
   */
  onBeforeWriteContentToOutput: 'linkus-on-before-write-content-to-output',

  /**
   * {Linkus}
   */
  onOutputDone: 'linkus-on-ouput-done',

  /**
   * {Linkus}
   */
  onBeforeCompile: 'linkus-on-before-compile',

  /**
   * {Linkus}
   */
  onCompile: 'linkus-on-compile',

  /**
   * {Linkus}
   */
  onCompileDone: 'linkus-on-compile-done',

  /**
   * {Linkus}
   */
  onBuildDone: 'linkus-on-build-done'
};

module.exports = LinkusEvent;