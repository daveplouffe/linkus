let propertyValidator = function () {
  let props;

  function validate(linkusProps) {
    props = linkusProps;
    validateBuilds();
    validateBasedir();
  }

  function validateBuilds() {
    if (props.builds.length === 0) {
      console.error('There is no entry to build.');
      process.exit();
    }
  }

  function validateBasedir() {
    if (!props.basedir || props.basedir.length === 0) {
      console.error('You must give a basedir to resolve file path using « __dirname » or specifying the absolute path.');
      process.exit();
    }
  }

  return {
    validate
  }
};
module.exports = propertyValidator();

