import webpack from 'webpack';

var definePlugin = new webpack.DefinePlugin({
  'process.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
});

const config: webpack.Configuration = {
  devtool: "inline-source-map",
  entry: "./src/index.tsx",
  output: {
      path: __dirname,
      filename: "bundle.js"
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  },
  plugins: [definePlugin]
}

export default config