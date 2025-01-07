#!/usr/bin/env bash

docker run --init --cap-add=SYS_ADMIN --rm -p3000:3000 --platform=linux/amd64 html-to-pdf
