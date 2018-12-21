#!/bin/bash

rm $PWD/res/compression.worker.blob
npx webpack -p
mv $PWD/res/compression.worker.js $PWD/res/compression.worker.blob
