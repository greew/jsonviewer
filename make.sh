#!/bin/bash

BUILDFOLDER=JSONViewer.safariextension

function clean { # Clean up

    rm -rf ${BUILDFOLDER}

}

function ready { # Setup all folders and files (used for testing)

    # Firstly, clean up if build dir exists
    clean

    # Create directories anew
    mkdir -p ${BUILDFOLDER}/scripts ${BUILDFOLDER}/styles ${BUILDFOLDER}/docs

    # Copy static content to folders
    cp styles/style.css ${BUILDFOLDER}/styles/
    cp docs/* ${BUILDFOLDER}/docs/
    cp plist/* ${BUILDFOLDER}/

    # Minify javascript code
    curl -s \
        -d compilation_level=ADVANCED_OPTIMIZATIONS \
        -d output_format=text \
        -d output_info=compiled_code \
        --data-urlencode "js_code@scripts/end.js"  \
        http://closure-compiler.appspot.com/compile \
        > ${BUILDFOLDER}/scripts/end.min.js
}

function build { # Setup and build extension file

    ready

    osascript buildExtension.scpt

    # Nothing yet

}

function deploy {

}

function help { # Show this help message
    echo "Build script for JSON Viewer Safari Extension"
    echo
    echo "A list of function:"
    grep "^function" $0

    exit 0
}

# Check if any arguments exists
if [ $# -eq 0 ]; then
    help
    exit 1
fi

# Check if the given argument is the name of a function
if [ "`type -t $1`" != "function" ]; then
    echo "No such function"
    echo
    help
    exit 1
fi

# Run the command
$1