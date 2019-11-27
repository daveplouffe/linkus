/**
 * @type {{onBuildDone: string, onBeforeCompile: string, onBeforeBuild: string, onResolve: string, onResolveDone: string, onLinkingDone: string, onMakeOutput: string, onBeforeResolve: string, onCompile: string, onOutputDone: string, onBeforeWriteContentToOutput: string, onCompileDone: string}}
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


  /** {linkus} */
  onLinkingDone: 'linkus-on-linking-done',

  /**
   * {Linkus}
   */
  onBuildDone: 'linkus-on-build-done'
};

module.exports = LinkusEvent;