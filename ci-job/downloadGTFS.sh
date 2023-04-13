#!/bin/sh

mkdir capmetro
cd ./capmetro
curl -L https://data.texas.gov/download/r4v4-vz24/application%2Fzip --output capmetro.zip
unzip -o capmetro.zip
rm capmetro.zip


