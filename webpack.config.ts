import webpack from 'webpack';
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const plugins = [
  new webpack.DefinePlugin({
    'process.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  })
]

if (process.env.ANALYZE_BUNDLE) {
  plugins.push(new BundleAnalyzerPlugin())
}

const config: webpack.Configuration = {
  mode: process.env.NODE_ENV as webpack.Configuration["mode"],
  devtool: process.env.NODE_ENV === "production" ? undefined : "inline-source-map",
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
  plugins
}

export default config