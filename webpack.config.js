const path = require("path")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const FixDefaultImportPlugin = require("webpack-fix-default-import-plugin")

module.exports = {
    mode: "development",
    devtool: "source-map",
    entry: "./src/index.ts",
    output: {
        library: "ProcessCore",
        libraryTarget: "this",
        path: path.resolve(__dirname, "./dist"),
        filename: 'index.js',
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new FixDefaultImportPlugin(),
    ],
}
