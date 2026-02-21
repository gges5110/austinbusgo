#!/bin/sh

mkdir -p capmetro
cd ./capmetro
echo "Start downloading GTFS..."
curl -L https://data.texas.gov/download/r4v4-vz24/application%2Fzip --output capmetro.zip

echo "Unzipping GTFS files..."
unzip -o capmetro.zip
rm capmetro.zip


