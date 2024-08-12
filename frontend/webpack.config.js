const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require('webpack');

function assetsPath(_path) {
	return path.posix.join("assets", _path);
}

const isProduction = process.env.NODE_ENV === "production";

let plugins = [
	new MiniCssExtractPlugin({
		filename: "styles/[name].[contenthash].css",
		chunkFilename: "styles/[id].[contenthash].css",
	}),
	new CopyWebpackPlugin({
		patterns: [
			{ from: "./favicon.ico", to: "favicon.ico" },
			{ from: "static", to: "static" },
		],
	}),
	new HtmlWebpackPlugin({
		chunks: ['app'],
		title: "PenEditor",
		favicon: path.resolve("favicon.ico"),
		template: "./src/template.html",
	}),
];

if (isProduction) {
	plugins.push(
		new BundleAnalyzerPlugin(),
		new CleanWebpackPlugin()
	);
} else {
	plugins.push(
		new webpack.HotModuleReplacementPlugin()
	);
}

module.exports = {
	entry: { app: "./src/index.tsx" },
	mode: process.env.NODE_ENV,
	output: {
		filename: "modules/[name].[contenthash].js",
		publicPath: "/",
		path: path.resolve(__dirname, "dist"),
	},
	devtool: isProduction ? false : "source-map",
	devServer: {
		host: "0.0.0.0",
		port: 8505,
		historyApiFallback: true,
		allowedHosts: 'all',
		static: { directory: path.resolve(__dirname, "dist") },
		hot: !isProduction,
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".jsx", ".json", ".less", ".css"],
		alias: { '@codemirror/state': path.resolve(__dirname, 'node_modules/@codemirror/state/dist/index.cjs') },
	},
	module: {
		rules: [
			{
				test: /\.less$/,
				use: [
					isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
					'css-loader',
					'less-loader',
				],
			},
			{
				test: /\.css$/,
				use: [
					isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
					'css-loader',
				],
			},
			{
				test: /\.(t|j)sx?$/,
				exclude: /node_modules/,
				use: ['ts-loader'],
			},
			{
				test: /\.mjs$/,
				include: /node_modules/,
				type: 'javascript/auto'
			},
			{
				test: /\.(webp|png|jpe?g|gif|svg|ttf|woff|eot)(\?.*)?$/,
				type: 'asset/resource',
				generator: {
					filename: assetsPath('images/[name].[contenthash:7][ext][query]')
				}
			},
			{
				enforce: "pre",
				test: /\.js$/,
				exclude: /node_modules/,
				loader: "source-map-loader"
			}
		],
	},
	plugins: plugins,
};
