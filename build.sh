export NODE_ENV=$1
rm -rf ./dist
webpack --progress --bail --config ./webpack.config.js
