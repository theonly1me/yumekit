#!/usr/bin/env bash
set -euo pipefail

cache_folder="$1"
scripts_folder="$(dirname "$0")"
retry="${scripts_folder}/retryApt.sh"

install_from_cache() {
  compgen -G "${cache_folder}/*.deb" > /dev/null &&
    sudo dpkg --install "${cache_folder}"/*.deb
}

install_from_network() {
  bash "$retry" 3 60 sudo apt-get update
  bash "$retry" 4 120 sudo apt-get install --yes --download-only ffmpeg
  rm -rf "$cache_folder"
  mkdir -p "$cache_folder"
  sudo cp /var/cache/apt/archives/*.deb "$cache_folder"
  sudo chown -R "$(id -u):$(id -g)" "$cache_folder"
  sudo apt-get install --yes --no-download ffmpeg
}

if install_from_cache; then
  echo "Installed FFmpeg from the cache."
else
  echo "Installing FFmpeg from the network."
  install_from_network
fi

ffmpeg -hide_banner -encoders | grep --word-regexp libx264 > /dev/null
ffmpeg -hide_banner -encoders | grep --word-regexp aac > /dev/null
ffmpeg -hide_banner -filters | grep --word-regexp sine > /dev/null
ffmpeg -hide_banner -filters | grep --word-regexp overlay > /dev/null
ffprobe -hide_banner -version
