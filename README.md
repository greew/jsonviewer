JSON Viewer
===========
JSON Viewer is an extension for the [Safari browser](http://www.apple.com/safari/ "Safari browser"). It takes JSON and JSONP responses and converts the response from one-line-impossible-to-read gibberish into a nicely formatted setup with colours and indentations. 

Get started
-----------
Download the file "JSON Viewer.safariextz" and double click it. It will automatically install itself into Safari.

Features
--------
The extension runs on each response and checks if the data from the response

- the location hash doesn't contain the word 'raw'
- has only one element, which is a &lt;pre&gt; tag (which is Safari's standard way of showing JSON responses)
- starts with either "[", "{" or a function call with an argument that starts with either "[" or "{"
- parses as JSON

If all of the above returns successful, the extension begins to setup the prettified JSON.

It is still possible to switch between the prettified JSON and the original JSON response with a single click on a button.

Attributes of the prettified JSON
---------------------------------
- For each new nesting level, the input is indented to allow for easy distinction between levels of data.
- Different data types are written in different colors to allow for easy distinct of data types.
- Lets the user collapse and expand objects and arrays. Either individually or all at once. 

Ideas and to comes
------------------
- Let the user define colors for data types.
- Let the user show/hide the type names

If you've got any other ideas or find any bugs, please let me know, either by emailing me or by creating a pull request.

Contact
--------
Name: Jesper Skytte Hansen

E-mail: jesper@skytte.it

License
-------
JSON Viewer is open source software licensed under the New BSD License. See the docs/LICENSE.txt file for more information.

Changelog
---------
1.0.0 - 2015-12-21:
Created the initial version.