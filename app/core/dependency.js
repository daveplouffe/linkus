let dependency = function () {

  function reorderImports(importList) {
    let i = 0;
    treated = {};
    ordered = [];
    let N = importList.length;
    for (; i < N; i++) {
      if (importList[i].importCount === 0) {
        treated[importList[i].ino] = 1;
        ordered.push(importList[i++]);
      }
    }
    i = 0;
    while (ordered.length !== N) {
      let file = importList[i];
      if (treated[file.ino] !== 1) {
        let count = 0;
        for (let j = 0; j < file.imports.length; j++) {
          if (treated[file.imports[j].ino]) count++;
          else break;
        }
        if (count === file.imports.length) {
          ordered.push(file);
          treated[file.ino] = 1;
        } else {
          importList.push(file);
        }
      }
      i++;
    }
    return ordered;
  }


  let ordered;
  let treated;

  function diff(arA, arB) {
    let diff = [];
    for (let m in arA) {
      if (!arB[m])
        diff.push(m);
    }
    return diff;
  }

  return {
    reorder(orderedImports) {
      return reorderImports(orderedImports);
    },

    fileImportToArray(fileImports) {
      let dependencies = [];
      let keys = Object.keys(fileImports.imports);
      for (let i = 0; i < keys.length; i++)
        dependencies.push(fileImports.imports[keys[i]]);
      return dependencies;
    },

    arrayImportToInoKey(imports) {
      let dependencies = [];
      imports = imports || [];
      for (let i = 0; i < imports.length; i++)
        dependencies[imports[i].ino] = imports[i];
      return dependencies;
    },

    hasSameDependencies(dependencies1, dependencies2) {
      let dif = diff(dependencies1, dependencies2)
        .concat(diff(dependencies2, dependencies1));
      return dif.length <= 0;
    }
  }
}();

module.exports = dependency;