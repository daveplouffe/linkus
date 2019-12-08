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
  let imports;

  function resolveOrdered2() {
    treated = {};
    ordered = [];
    let keys = Object.keys(imports);
    let N = keys.length;
    let i = 0;
    keys.sort(sortingAlgorithm);
    while (imports[keys[i]].importCount === 0 && i < N) {
      treated[keys[i]] = 1;
      ordered.push(imports[keys[i++]]);
    }
    while (ordered.length !== N) {
      let file = imports[keys[i]];
      let count = 0;
      let fileKeys = Object.keys(file.imports);
      for (let j = 0; j < fileKeys.length; j++) {
        if (treated[fileKeys[j]]) count++;
        else break;
      }
      if (count === fileKeys.length) {
        let curImports = imports[file.ino].imports;
        file.imports = [];
        for (let m in curImports) file.imports.push(curImports[m]);
        ordered.push(file);
        treated[file.ino] = 1;
      } else {
        keys.push(keys[i]);
      }
      i++;
    }
    return ordered;
  }

  function sortingAlgorithm(a, b) {
    let da = imports[a];
    let db = imports[b];
    if (da.importCount > db.importCount) return 1;
    if (da.importCount < db.importCount) return -1;
    return 0;
  }

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

    resolveOrdered(listOfImports) {
      let ordered = [];
      imports = listOfImports;
      //resolveOrdered(listOfImports, ordered);
      ordered = resolveOrdered2();
      return ordered;
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