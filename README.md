# linkus
### Exemple of use:


    let linkus = require('linkus/linkus');
  
    let isProd = false;
    let builds = [];

    builds.push({
        entry: './entry1.js',
        output: './output1.js'
    });
    builds.push({
        entry: './entry2.js',
        output: './output2.js'
    });

    linkus.create({
        basedir: __dirname,
        oldBuildCount: 5,
        builds : builds,
        // fileMapping: {
        //     enabled: isProd,
        //     files: [
        //         {from:'file1.js', to: 'file2.js'}
        //     ]
        // },
        compile: {
            compilationLevel: 'ADVANCED_OPTIMIZATIONS', //'SIMPLE_OPTIMIZATIONS',
            enabled: isProd,
            isDebugMode: false,
        },
    });


