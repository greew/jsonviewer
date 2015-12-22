"use strict";
/** @preserve
 * Copyright (c) 2015, Jesper Skytte Hansen <jesper@skytte.it>
 * All rights reserved.
 * See license located in docs/LICENSE.txt
 */
(function () {

    /**
     * The constructor, that starts it all!
     * @constructor
     */
    var JsonViewer = function () {

        this.body = document.body;

        if (document.location.hash.indexOf('raw') > -1) {
            return;
        }

        /**
         *
         * @type {!Element|boolean}
         */
        var containingElement = this.checkInitial();

        // If not found, stop here.
        if (containingElement === false) {
            return;
        }
        var json = containingElement.textContent;

        var data = this.checkForJSON(json) || this.checkForJSONP(json);
        if (data === false) {
            return;
        }

        // Validate JSON
        try {
            data.json = JSON.parse(data.json);
        }
        catch (e) {
            return;
        }

        this.prettifyJSON(data);
        this.setupListeners();
    };

    /**
     *
     * @returns {!Element|boolean} The containing element or false on not found.
     */
    JsonViewer.prototype.checkInitial = function () {
        // Check if we only have one element
        if (this.body.childNodes.length != 1) {
            return false;
        }

        var el = this.body.childNodes[0];
        if (el.tagName.toLowerCase() != 'pre') {
            return false;
        }
        return el;
    };

    /**
     *
     * @param {string} content
     * @returns {{json: string}|boolean} The JSON string if first string is { or [
     */
    JsonViewer.prototype.checkForJSON = function (content) {
        var char = content.charAt(0);
        if (char == "{" || char == "[") {
            return {
                json: content
            };
        }
        return false;
    };

    /**
     *
     * @param {string} content
     * @returns {{json: string, function: string, endingSemicolon: boolean}|boolean} The JSON string if first string is { or [
     */
    JsonViewer.prototype.checkForJSONP = function (content) {
        var regexp = /^([^\(]+)\((([{\[])(.*)([}\]]))\)(;)?$/;
        var matches = content.match(regexp);
        if (!matches) {
            return false;
        }
        return {
            json: matches[2],
            function: matches[1],
            endingSemicolon: matches[6] ? true : false
        };
    };

    /**
     *
     * @param {{json: string, function: string, endingSemicolon: boolean}|{json: string}} data
     */
    JsonViewer.prototype.prettifyJSON = function (data) {

        this.style = this.createElement('link');
        this.style.setAttribute('rel', 'stylesheet');
        this.style.setAttribute('type', 'text/css');
        this.style.setAttribute('media', 'all');
        this.style.setAttribute('href', safari['extension'].baseURI + 'styles/style.css');

        this.buttons = this.createButtons();

        this.prettified = this.createElement('div', 'prettified', 'Loading...');

        this.original = this.body.firstChild;
        this.original.hidden = true;

        var root = this.createElement('div', 'root', [
            this.style,
            this.buttons,
            this.prettified,
            this.original
        ]);

        this.body.appendChild(root);

        this.prettified.textContent = '';

        this.append(
            this.prettified,
            this.functionName(data, this.value(data.json))
        );
    };

    JsonViewer.prototype.functionName = function(data, json) {
        var jsonP = data.function !== undefined;
        var el = this.createDocumentFragment();
        if (jsonP) {
            this.append(el, this.createElement('div', 'type function', data.function + '('));
        }
        this.append(el, json);
        if (jsonP) {
            this.append(el, ')');
        }
        return el;
    };

    /**
     *
     * @param {*} json
     * @returns {Element}
     */
    JsonViewer.prototype.value = function (json) {
        var type = this.typeOf(json);
        switch (type) {
            case 'object':
                return this.createObject(json);
            case 'array':
                return this.createArray(json);
            case 'null':
            case 'number':
            case 'string':
            case 'boolean':
                return this.createSingle(json, type);
        }
        return null;
    };

    JsonViewer.prototype.createObject = function (json) {

        var numPairs = 0;
        var elements = [];
        for (var index in json) {
            if (!json.hasOwnProperty(index)) {
                continue;
            }

            var valueType = this.typeOf(json[index]);
            var collapsible = valueType === 'object' || valueType === 'array';

            numPairs++;

            var collapser = null;
            var kvPairClass = '';
            if (collapsible) {
                collapser = this.createElement('span', 'collapser');
                kvPairClass = 'collapsible expanded';
                collapser.addEventListener('click', this.changeCollapseState.bind(this));
            }

            elements.push(
                this.createElement(
                    'li',
                    kvPairClass,
                    [
                        collapser,
                        '"',
                        this.createElement('span', 'key', index),
                        '"',
                        this.createElement('span', 'colon', ':'),
                        this.value(json[index]),
                        this.createElement('span', 'comma', ',')
                    ]
                )
            );
        }

        return this.createDocumentFragment(
            '{',
            this.createElement('ul', 'object onlyExpanded', elements),
            this.createElement('span', 'onlyCollapsed', '...'),
            '}',
            this.createElement('span', 'numHiddenElements onlyCollapsed', '(' + numPairs + ' hidden elements)')
        );
    };

    JsonViewer.prototype.createArray = function (json) {

        var elements = [];
        var arrayLength = json.length;
        for (var index = 0; index < arrayLength; index++) {
            var valueType = this.typeOf(json[index]);
            var collapsible = valueType === 'object' || valueType === 'array';

            var collapser = null;
            var kvPairClass = '';
            if (collapsible) {
                collapser = this.createElement('span', 'collapser');
                kvPairClass = 'collapsible expanded';
                collapser.addEventListener('click', this.changeCollapseState.bind(this));
            }

            elements.push(
                this.createElement('li', kvPairClass, [
                    collapser,
                    this.value(json[index]),
                    this.createElement('span', 'comma', ',')
                ])
            );
        }

        return this.createDocumentFragment(
            '[',
            this.createElement('ul', 'array onlyExpanded', elements),
            this.createElement('span', 'onlyCollapsed', '...'),
            ']',
            this.createElement('span', 'numHiddenElements onlyCollapsed', '(' + arrayLength + ' hidden elements)')
        );
    };

    /**
     *
     * @param {*} json
     * @param {string} type
     * return {!Element}
     */
    JsonViewer.prototype.createSingle = function (json, type) {
        var value;
        switch (type) {
            case 'number':
                value = json + "";
                break;
            case 'string':
                value = '"' + json + '"';
                break;
            case 'boolean':
                value = json ? 'true' : 'false';
                break;
            case 'null':
                value = 'null';
                break;
        }

        return this.createElement('span', 'type ' + type, value);
    };

    JsonViewer.prototype.createButtons = function () {

        this.changeShowingBtn = this.createElement('button', null, 'Show original/prettified JSON');

        this.collapseExpandBtn = this.createElement('button', null, 'Collapse/Expand all');

        return this.createElement('div', 'buttons', [
            this.changeShowingBtn,
            this.collapseExpandBtn
        ]);
    };

    JsonViewer.prototype.changeShowing = function () {
        this.original.hidden = !this.original.hidden;
        this.prettified.hidden = !this.prettified.hidden;
    };

    JsonViewer.prototype.changeCollapseState = function(event) {
        var container = event.target.parentElement;
        var collapse = this.hasClass(container, 'expanded');
        if (collapse) {
            this.collapse(container);
        } else {
            this.expand(container);
        }
    };

    JsonViewer.prototype.collapse = function(el) {
        this.addRemoveClass(el, 'expanded', 'collapsed');
    };

    JsonViewer.prototype.expand = function(el) {
        this.addRemoveClass(el, 'collapsed', 'expanded');
    };

    /**
     * Collapse or expand all collapsable objects.
     */
    JsonViewer.prototype.collapseExpandAll = function() {
        var collapsibles = document.querySelectorAll('.collapsible');
        var length = collapsibles.length;
        var collapse;
        for (var i = 0; i < length; i++) {
            if (i == 0) {
                collapse = this.hasClass(collapsibles[i], 'expanded');
            }
            collapse ? this.collapse(collapsibles[i]) : this.expand(collapsibles[i]);
        }
    };

    /**
     * Returns the type of the given element.
     * @param {*} el The element to test.
     * @returns {string} The name of the type.
     */
    JsonViewer.prototype.typeOf = function(el) {
        var type = typeof el;
        switch (type) {
            case 'object':
                if (el === null) {
                    return 'null';
                }
                switch (typeof (el.length)) {
                    case 'undefined':
                        return 'object';
                    case 'number':
                        return 'array';
                }
                break;
        }
        return type;
    };

    /**
     * Setup listeners on different objects.
     */
    JsonViewer.prototype.setupListeners = function() {
        this.changeShowingBtn.addEventListener('click', this.changeShowing.bind(this));
        this.collapseExpandBtn.addEventListener('click', this.collapseExpandAll.bind(this));
    };

    // -----------------------------------
    // Element helper functions
    // -----------------------------------

    /**
     *
     * @param tagName
     * @param opt_className
     * @param children
     * @returns {!Element}
     */
    JsonViewer.prototype.createElement = function(tagName, opt_className, children) {
        var el = document.createElement(tagName);
        if (opt_className) {
            this.setClass(el, opt_className);
        }
        if (children) {
            if (this.typeOf(children) != 'array') {
                children = [children];
            }
            var length = children.length;
            for (var i = 0; i < length; i++) {
                var c = children[i];
                var type = this.typeOf(c);
                if (type === 'null') {
                    continue;
                }
                if (type === 'string' || type === 'number') {
                    c = document.createTextNode(c + "");
                }
                el.appendChild(c);
            }
        }
        return el;
    };

    /**
     * @param {...(Element|string|number)} var_args
     * @returns {!DocumentFragment}
     */
    JsonViewer.prototype.createDocumentFragment = function(var_args) {
        var fragment = document.createDocumentFragment();
        this.append.apply(this, [fragment].concat([].slice.call(arguments)));
        return fragment;
    };

    /**
     *
     * @param {!Element|!DocumentFragment} el
     * @param {...(!Element|string)} var_args
     * @returns {!Element|!DocumentFragment}
     */
    JsonViewer.prototype.append = function(el, var_args) {
        var argsLength = arguments.length;
        for (var i = 1; i < argsLength; i++) {
            var c = arguments[i];
            var type = this.typeOf(c);
            if (type === 'null') {
                continue;
            }
            if (type === 'string' || type === 'number') {
                c = document.createTextNode(c + "");
            }
            el.appendChild(c);
        }
        return el;
    };

    /**
     * Return whether the given element has 'className' as a part of it's class.
     *
     * @param {!Element} el
     * @param {string} className
     * @returns {boolean} True if element has class, false otherwise.
     */
    JsonViewer.prototype.hasClass = function(el, className) {
        return el.className.indexOf(className) > -1;
    };

    /**
     * Set the class of an element.
     * @param {!Element} el
     * @param {string} className
     */
    JsonViewer.prototype.setClass = function(el, className) {
        el.className = className;
    };

    /**
     * Remove a class name of the class of an element.
     * @param {!Element} el
     * @param {string} className
     * @param {string=} opt_addClassName
     */
    JsonViewer.prototype.removeClass = function(el, className, opt_addClassName) {
        var classes = el.className.split(' ');
        var index = classes.indexOf(className);
        if (index > -1) {
            classes.splice(index, 1, opt_addClassName);
        }
        el.className = classes.join(' ');
    };

    /**
     * Remove one part of the class and add another part to the class of an element.
     * @param {!Element} el
     * @param {string} removeClassName
     * @param {string} addClassName
     */
    JsonViewer.prototype.addRemoveClass = function(el, removeClassName, addClassName) {
        this.removeClass(el, removeClassName, addClassName);
    };

    // Run it!
    new JsonViewer();
}());