module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    libraryTarget: 'var',
    library: 'getMetaEvidence'
  },
     optimization: {
        minimize: true
    }
};
