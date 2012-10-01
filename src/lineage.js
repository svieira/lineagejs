(function(Lineage, global){
    "use strict";

    Lineage.copyright = [
    // ============================================================================================
    'lineage.js - http://code.google.com/p/lineagejs',

    'Copyright (C) 2009-2012 by Thomas ("T.J.") Crowder (tj@crowdersoftware.com)',
    'Licensed under the "MIT License":',
    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
    'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'

    // ============================================================================================
    ].join(" | ");
    // (See "Copyright note" below)

    /*
    ===============================================================================================

    lineage.js
    ----------

    Lineage is a simple toolkit for creating JavaScript constructor functions and their
    prototypes in a straight-forward and concise way. Lineage's plumbing and API provide:

    * A way of creating constructors and prototypes with a very concise syntax, while still
      encouraging you to create functions with real names (rather than anonymous functions); this
      helps your tools help you (debuggers show function names in call stacks, for example). You
      can use anonymous functions if you prefer, of course.

    * A _highly efficient_ mechanism for "supercalls" (calling into the parent prototype's
      versions of methods from an instance that has a derived prototype).

    * Encouragement and support for using of the module pattern for each constructor and its
      prototype.

    Visit http://code.google.com/p/lineagejs/wiki/Documentation for detailed documentation and
    usage examples.

    -----

    Copyright note: Making the copyright above a public string is a convenience thing, helping
    ensure it survives most minifiers / compressors / packers / etc. without your having to do
    anything. If you don't like it being an in-memory string, you're welcome to turn it into a
    comment, just make sure it is included in the minified/compressed/packed/etc. file.

    ===============================================================================================
    */

    // ==== Variables =============================================================================

    var toStringProblematic,    // true if 'toString' may be missing from for..in
        valueOfProblematic,     // true if 'valueOf' may be missing from for..in
        getTypeString,          // Used for getting the full type string of an instance
        oldLineage;             // Old value of `global.Lineage`, if any

    // ==== Some Basic Setup ======================================================================

    getTypeString = Object.prototype.toString;
    oldLineage = global.Lineage;
    global.Lineage = Lineage;
    Lineage.version = "0.4.1";

    // ==== Public Functions ======================================================================

    /**
     * Lineage.define defines (creates) a constructor function and its prototype.
     *
     * See http://code.google.com/p/lineagejs/wiki/Documentation for examples.
     *
     * @param   {string}    name    An optional name for your constructor. If given, the generated
     *                              constructor will have this as its actual name (the name that
     *                              shows up in call stacks in debuggers, etc.). If you don't
     *                              provide this, the function will be anonymous.
     * @param   {function}  parent  An optional parent constructor.
     * @param               ...     One or more specification objects containing properties to put
     *                              on our constructor function's prototype; OR, functions that
     *                              return specification objects. If a property is defined by more
     *                              than one specification object, the last in the list wins.
     * @return  {function} A constructor function for instances that will have the given prototype.
     */
    Lineage.define = Lineage_define;
    function Lineage_define() {
        var arg,            // Each arg as we handle it
            ctorName,       // Our constructor name, if any
            parent,         // Our parent constructor function, if any
            parentProto,    // parent.prototype or undefined
            argsIndex,      // Index of first unused argument in `arguments`
            ctor,           // The constructor function we create and return
            ctorProto,      // ctor.prototype
            names,          // The names of the properties in `members`
            nameIndex,      // Index into `names`
            name;           // Each name in `names`

        // We use this index to keep track of the arguments we've consumed
        argsIndex = 0;

        // Do we have a constructor name?
        arg = arguments[argsIndex];
        if (isString(arg)) {
            // Yes
            ctorName = arg;
            ++argsIndex;
            arg = arguments[argsIndex];
        }

        // Do we have a parent?
        if (isFunction(arg) && arg._isConstructor) {
            // Yes
            parent = arg;
            parentProto = parent.prototype;
            ++argsIndex;
        }

        // Get our constructor; this will hook up the parent's prototype if there's a parent
        // constructor, and mark the new constructor as a constructor
        ctor = generateCtor(ctorName, parent);
        ctorProto = ctor.prototype;

        // Assign the members from the specification object(s) to the prototype.
        // Typically there's only spec object, but allow for more.
        while (argsIndex < arguments.length) {
            // Get this specification object
            arg = arguments[argsIndex++];
            if (isFunction(arg)) {
                // It's a function. If it's a constructor, fail; the user has the arguments in
                // the wrong order.
                if (arg._isConstructor) {
                    throw "Invalid specification object factory function; check order of arguments to `Lineage.define`";
                }

                // Call it to get the spec object
                arg = arg(ctorProto, parentProto, ctor, parent);
                if (isObject(arg) || arg === ctorProto) {
                    arg = undefined;
                }
            }

            // If it's a specification object, copy its properties to the prototype
            if (isObject(arg)) {
                // Get all of the property names on the spec object
                names = getNames(arg);

                // Copy the members
                for (nameIndex = names.length - 1; nameIndex >= 0; --nameIndex) {
                    name = names[nameIndex];
                    ctorProto[name] = arg[name];
                }
            }
        }

        // If there's no initialize function, provide one.
        // Note that this can only happen when we don't have a parent; when we're doing a derived
        // prototype, the check will find the parent's version if the specification object didn't
        // provide one. Which is what we want.
        if (!('initialize' in ctor.prototype)) {
            ctor.prototype.initialize = createNoop();
        }

        // Return the constructor
        return ctor;
    }

    /**
     * Lineage.noConflict releases the "Lineage" global symbol, restoring any previous value it
     * may have had. Note that this is not perfect: If there *was* no previous "Lineage" global,
     * you'll end up with one with the value `undefined` (as opposed to going back to not having
     * one at all). Not important enough to add code to work around, esp. given Microsoft's
     * JScript's issue with deleting properties from window.
     *
     * @param   {function}  callback    If you want Lineage to call your code when you call
     *                                  noConflict, supply a function here. It will receive
     *                                  a reference to Lineage as its only argument.
     * @returns {Object} a reference to Lineage you can assign to a variable so you can access
     *          the API.
     */
    Lineage.noConflict = Lineage_noConflict;
    function Lineage_noConflict(callback) {
        if (global.Lineage === Lineage) {
            global.Lineage = oldLineage;
        }
        if (isFunction(callback)) {
            callback(Lineage);
        }
        return Lineage;
    }

    // ==== Private Functions =====================================================================

    // Determine if the given argument is a string (primitive or String object)
    function isString(s) {
        return getTypeString.call(s) === '[object String]';
    }

    // Determine if the given argument is a function
    function isFunction(f) {
        return typeof f === 'function';
    }

    // Determine if the given argument is an object
    function isObject(o) {
        return typeof o === 'object';
    }

    // IE doesn't enumerate toString or valueOf; detect that (once) and remember so `define` can
    // deal with it. We do this with an anonymous function we don't keep a reference to to
    // minimize what we keep around when we're done.
    (function(){
        var name;

        toStringProblematic = valueOfProblematic = true;
        for (name in {toString: true, valueOf: true}) {
            if (name === 'toString') {
                toStringProblematic = false;
            }
            if (name === 'valueOf') {
                valueOfProblematic = false;
            }
        }
    })();

    // This function is used to create the prototype object for our generated constructors if the
    // constructor has a parent constructor. See generateCtor for details.
    function createProto() { }

    // Build and return a constructor; we do this with a separate function to minimize what the new
    // constructor (a closure) closes over.
    function generateCtor(name, parentCtor) {
        var ctor;

        // Create the constructor
        if (name) {
            // Name was supplied, create a function with that name, without letting the name
            // leak into the enclosing scope and without triggering the broken handling of
            // named function expressions in pre-IE9 versions of Microsoft's JScript; more:
            // http://blog.niftysnippets.org/2010/09/double-take.html
            //
            // Note we don't validate the name, and so in theory this `eval` could execute any
            // arbitrary code and blow things up. A couple of reasons we don't bother:
            // 1. We already call functions being supplied to us by the caller, which could do
            //    anything anyway. E.g., we already trust the caller.
            // 2. *Correctly* validating a function name would increase the size of the Lineage
            //    script by something like a full order of magnitude; see:
            //    http://stackoverflow.com/questions/2008279
            // `eval` is not evil when you control the context and you're doing something
            // you _cannot_ do any other way. See also:
            // http://blog.niftysnippets.org/2012/02/creating-function-with-true-name.html
            ctor = eval(
                "(function() {\n" +
                "    function " + name + "() {\n" +
                "        // Lineage-generated constructor: Call the initialize function\n" +
                "        this.initialize.apply(this, arguments);\n" +
                "    }\n" +
                "    return " + name + ";\n" +
                "})();"
            );
        }
        else {
            // No name given, use an anonymous function
            ctor = function() {
                // Lineage-generated constructor: Call the initialize function
                this.initialize.apply(this, arguments);
            };
        }

        // If there's a parent prototype, hook it up. We go indirectly through `createProto`
        // rather than simply doing "new parentCtor()" because calling `parentCtor` will call the
        // parent's `initialize` function, which we don't want to execute. We just want the
        // prototype.
        if (parentCtor) {
            createProto.prototype = parentCtor.prototype;
            ctor.prototype = new createProto();
            createProto.prototype = {};   // Don't leave a dangling reference
        }

        // Set the prototype's constructor property so `this.constructor` resolves correctly
        ctor.prototype.constructor = ctor;

        // Flag up that this is a constructor
        ctor._isConstructor = true;

        // Return the newly-constructed constructor
        return ctor;
    }

    // Build and return a no-op function. Used primarily for creating default `initialize`
    // functions when a parent constructor's specification object doesn't provide one. We _could_
    // have all of them share just one, since by definition it's only for parent constructors
    // (derived ones will inherit the one from their parent), but if users put special properties
    // on it, that would get messy fast.
    function createNoop() {
        return function() { };
    }

    // Get the names in a specification object, allowing for `toString` and `valueOf` issues
    function getNames(members) {
        var names,      // The names of the properties in `members`
            name,       // Each name
            nameIndex;  // Index into `names`

        names = [];
        nameIndex = 0;
        for (name in members) { // Note no "own property" defense, use _all_ props from spec obj
            names[nameIndex++] = name;
        }
        if (toStringProblematic && typeof members.toString !== 'undefined') {
            names[nameIndex++] = 'toString';
        }
        if (valueOfProblematic && typeof members.valueOf !== 'undefined') {
            names[nameIndex++] = 'valueOf';
        }
        return names;
    }

    // ==== Done ==================================================================================

    // Return the public object
    return Lineage;
})({}, this);
