let FileWatcher = function () {
  let onFileChange;

  function start(that) {
    let monitor = [];
    if (that.props.watch.enabled === true) {
      console.log('watch file is on');
      if (that.props.watch.paths.length === 0) {
        that.props.watch.paths = Utils.breakFullPathFile(fs.realpathSync(that.props.builds[0].entry)).path;
      }
      if (typeof that.props.watch.paths === 'string') {
        that.props.watch.paths = [that.props.watch.paths];
      }
      for (let n = 0; n < that.props.watch.paths.length; n++) {
        monitor[n] = fsmonitor.watch(that.props.watch.paths[n], {
          // include files
          matches: function (relpath) {
            return relpath.match(that.props.watch.extensions) !== null;
          },
          // exclude directories
          excludes: function (relpath) {
            return relpath.match(/^\.git$|build/i) !== null;
          }
        });
        monitor[n].on('change', function (changes) {
          if (onFileChange) onFileChange(that);
        });
      }
    }
  }


  return {
    start,
    onFileChange
  }

};

module.exports = FileWatcher;