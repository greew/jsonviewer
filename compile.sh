#!/bin/bash

curl -s \
    -d compilation_level=ADVANCED_OPTIMIZATIONS \
    -d output_format=text \
    -d output_info=compiled_code \
    --data-urlencode "js_code@scripts/end.js"  \
    http://closure-compiler.appspot.com/compile \
    > scripts/end.min.js