**TL;DR**? Check out: [Lineage by Example](LineageByExample.md)



# Introduction #

Lineage is about defining constructor functions and their associated prototypes (sometimes called "classes"), optionally in a lineage (hierarchy). Its syntax is concise and expressive. It encourages and supports:

  * Using proper function names (helping your tools help you)

  * Using scoping functions (e.g., the module pattern) to avoid creating unnecessary globals (and to have true private functions for your code)

  * Calling into the parent prototype's version of a function (e.g., doing a "supercall") easily and efficiently

Lineage stays out of your way, but gives you the tools needed to dramatically simplify creating constructors, prototypes, and lineages with JavaScript's powerful prototypical inheritance. (To get an idea how much simplicity you gain, check out the [comparison with plain JavaScript](ComparisonWithPlainJavaScript.md).)

Since code is worth a thousand words, let's jump right into it.

# Usage #

## Basic Use ##

If you're okay with anonymous functions:

```
var Thing = Lineage.define(function(p) {
    p.spiffy = function() {
        console.log("I'm a spiffy thing!");
    };
});
```

If you prefer your functions to have true names that show up in call stacks, lists of breakpoints, and such in a debugger:

```
var Thing = Lineage.define("Thing", function(p) {
    p.spiffy = spiffy;
    function spiffy() {
        console.log("I'm a spiffy thing!");
    }
});
```

Usage in either case:

```
var t = new Thing();
t.spiffy(); // Logs "I'm a spiffy thing"
```

There's no hierarchy in that example, but it nicely demonstrates the basics:

  * You call `Lineage.define` to define (create) a new constructor function.
  * You pass in a reference to a function (although you can pass in an object instead; more below); we call this the _specification function_ (as it will be used to specify your constructor and its prototype).
  * Lineage generates a constructor function for you, then calls the specification function you passed in, giving it the constructor's prototype object as an argument (in the above, we've called the object **`p`** -- for "prototype" or "public" -- but of course you can call it anything you want).
  * `Lineage.define` returns a reference to the generated constructor function.
  * You can _optionally_ pass in a name (as a string) to give the constructor, as the first argument to `Lineage.define`. If you don't, the constructor will be anonymous.

Note how easy it was to give both the constructor and the `spiffy` functions real names. If you wanted, you could even give the `spiffy` function an even more specific name:

```
    p.spiffy = Thing_spiffy;
    function Thing_spiffy() {
        console.log("I'm a spiffy thing!");
    }
```

...because the function name (what's shown in call stacks; `Thing_spiffy` above) doesn't have to be the same as the name we use on the prototype (`spiffy`, above). In this documentation, we'll be using the `Thing_spiffy` form, but understand that that's **only a convention we're using in our sample code**, there is no requirement at all that you do that with Lineage. (You don't have to give your functions names at all if you don't want to, much less names in some Lineage-specific format.)

But the above just demonstrates the absolute basics. Read on for more.

## Initializers ##

Many times, you'll want your constructor function to accept arguments used to initialize the new object. You can do that with Lineage by defining a function called `initialize`. The constructor Lineage generates will call `initialize` after creating the object, passing through all arguments given to the constructor:

```
var Thing = Lineage.define("Thing", function(p) {
    p.initialize = Thing_initialize;
    function Thing_initialize(name) {
        this.name = name;
    }

    p.spiffy = Thing_spiffy;
    function Thing_spiffy() {
        console.log("I'm a spiffy thing named '" + this.name + "'!");
    }
});

var t = new Thing("Fred");
t.spiffy(); // Logs "I'm a spiffy thing named 'Fred'!"
```

All constructors created with Lineage will have an `initialize` function on the prototype. When you define a new constructor with no parent, Lineage supplies the `initialize` function if you don't; and of course, derived constructors inherit the `initialize` function of their parent.

## Adding in some lineage (hierarchy) ##

Lineage makes prototypical hierarchies easy and declarative: When calling `Lineage.define`, the first argument after the optional name argument can be a "parent" constructor:

```
var Thing = Lineage.define("Thing", function(p) {
    p.spiffy = Thing_spiffy;
    function Thing_spiffy() {
        console.log("Thing_spiffy");
    }
    p.cool = Thing_cool;
    function Thing_cool() {
        console.log("Thing_cool");
    }
});

var NiftyThing = Lineage.define("NiftyThing", Thing, function(p) {
    p.spiffy = NiftyThing_spiffy;
    function NiftyThing_spiffy() {
        console.log("NiftyThing_spiffy");
    }
});

var t = new Thing();
t.spiffy();  // Logs "Thing_spiffy"
t.cool();    // Logs "Thing_cool"

var nt = new NiftyThing();
nt.spiffy();  // Logs "NiftyThing_spiffy"
nt.cool();    // Logs "Thing_cool"
```

In that example, `Thing` defines the functions `spiffy` and `cool`. `NiftyThing` uses `Thing` as its parent and so inherits `Thing`'s functions, but then overrides `spiffy` with its own version. So when we call `spiffy`, we see the version specific to `NiftyThing`, but when we call `cool` we see the parent's version, since `NiftyThing` doesn't override it.

## Calling parent functions ##

In our example above, suppose `NiftyThing_spiffy` wanted to call `Thing_spiffy` (e.g., call the parent version of a function, sometimes called a "supercall"), how would it do that? The standard JavaScript way would be like this:

```
function NiftyThing_spiffy() {
    Thing.prototype.spiffy.call(this); // Non-Lineage, plain JavaScript way
}
```

_(If you're not familiar with the_ `call` _and_ `apply` _features of JavaScript functions, see [§15.3.4.3](http://es5.github.com/#x15.3.4.3) and [§15.3.4.4](http://es5.github.com/#x15.3.4.4) of the spec. Basically, they let you call a function and tell it what_ `this` _should be.)_

Ugh, you have to write `Thing.prototype` all over the place, which is both verbose and repetitive (all those changes, if you decide to insert a new inheritance layer between them). _(There are shorter ways to do this if you use some boilerplate code -- as shown in the [comparison with plain JavaScript](ComparisonWithPlainJavaScript.md) -- but getting rid of repeated boilerplate code is usually a Good Thing<sup>(tm)</sup>.)_

With Lineage, you have a simpler, more concise option: The factory function you pass into `Lineage.define` receives a second argument we haven't mentioned yet: The parent prototype. So:
```
var Thing = Lineage.define(function(p) {
    p.spiffy = Thing_spiffy;
    function Thing_spiffy() {
        console.log("Thing_spiffy");
    }
    p.cool = Thing_cool;
    function Thing_cool() {
        console.log("Thing_cool");
    }
});

// Note second argument ---------------------------v
var NiftyThing = Lineage.define(Thing, function(p, pp) {
    p.spiffy = NiftyThing_spiffy;
    function NiftyThing_spiffy() {
        pp.spiffy.call(this);   // <=== Supercall
        console.log("NiftyThing_spiffy");
    }
});

var p = new Thing();
p.cool();    // Logs "Thing_cool"
p.spiffy();  // Logs "Thing_spiffy"

var c = new NiftyThing();
c.cool();    // Logs "Thing_cool"
c.spiffy();  // Logs "Thing_spiffy" then "NiftyThing_spiffy"
```

So instead of
```
Thing.prototype.spiffy.call(this);
```
we have
```
pp.spiffy.call(this);
```

Much more concise, and we don't have to repeat the name of the parent constructor all over the place (which amongst other things makes re-basing a constructor -- moving it elsewhere in the hierarchy -- difficult). And of course, you can call the second argument anything you like, it doesn't have to be `pp` (which we chose for the example because it's for the _parent prototype_). It's probably best to be consistent in what you use, though, whether you use `pp` or `$super` or `s` or `fluglehorn`... (Don't use `super`, though; it's a reserved word.)

### Parent `initialize` ###

When you define a constructor with Lineage, Lineage automatically makes the constructor call the `initialize` function. Lineage doesn't automatically call the _parent's_ `initialize` function, though, on the basis that the function signature of your derived `initialize` may be different from the parent version. So when creating a constructor with a parent, you typically will want to call the parent's `initialize` from your `initialize`:

```
var NiftyThing = Lineage.define("NiftyThing", Thing, function(p, pp) {
    p.initialize = NiftyThing_initialize;
    function NiftyThing_initialize(parentArg, childArg) {
        // Chain to parent
        pp.initialize.call(this, parentArg);

        // ...other stuff...
    }
});
```

Note that there we assumed the signature of `Thing#initialize` is different from that of `NiftyThing#initialize`. If they're the same, though (both take the same arguments), you can do this instead:

```
pp.initialize.apply(this, arguments);
```

Note, though, that using the `arguments` pseudo-array has [performance implications](http://jsperf.com/using-declared-arguments-vs-the-arguments-pseudo-array) on many JavaScript engines, so it's best to avoid using it if you don't have to. (They're not _terrible_, don't worry too much about it -- and Lineage has to use `arguments` internally in a couple of places -- but still worth noting.)

## "Static" or "Class" Members ##

In addition to the prototype (`p`) and parent prototype (`pp`), you can access the constructor function being defined as well and add properties to it:

```
var Thing = Lineage.define("Thing", function(p, pp, ctor) {
    // Note the third argument ---------------------^

    // Add to it to add to the function you'll call `Thing`
    ctor.staticMethod = function() {
        console.log("Static method");
    };
    ctor.answer = 42;
});

Thing.staticMethod();      // "Static method"
console.log(Thing.answer); // "42"
```

You can access the parent constructor function as well, it's the fourth argument to your specification function.

## Private Data, Private Functions ##

The function you pass into `Lineage.define` is a handy place to put private data and/or functions for your code:

```
var Thing = Lineage.define("Thing", function(p) {
    // Private data
    var foo = "bar";

    // A private function
    function msg(text) {
        console.log(text);
    }

    // Another private function, this one uses `this`
    function shout() {
        console.log(this.name);
    }

    // Another private function, this one uses `t`
    function shoutAgain(t) {
        console.log(t.name);
    }

    // A public initializer function
    p.initialize = Thing_initialize;
    function Thing_initialize(name) {
        this.name = name;
    }

    // A public function
    p.spiffy = Thing_spiffy;
    function Thing_spiffy() {
        // Use the private function and data.
        // Note that `msg` is not instance-specific in this case.
        msg("Foo is " + foo);
    }

    // Another public function
    p.cool = Thing_cool;
    function Thing_cool() {
       // Use our private `shout` function. Note that
       // the way we call it makes it instance-specific.
       shout.call(this);
    }

    // Another public function
    p.cool = Thing_cool;
    function Thing_cool() {
       // Use our private `shoutAgain` function, passing
       // in `this` rather than using `call`.
       // This may appeal to the procedural programmers out there.
       shoutAgain(this);
    }
});
```

Note that to define a private function, you just define it and don't put it on `p`. That's it.

Your private functions will be instance functions or not depending on how you call them. If you call them such that you set what `this` will be during the call, they're instance functions (see our call to `shout` above). If not, they're not instance-specific and you don't use `this` within them. (This latter category are called "static" or "class" functions in class-based OOP.) Remember that JavaScript [doesn't have methods](http://blog.niftysnippets.org/2008/03/mythical-methods.html), just functions; what `this` is during a function call [depends entirely on how you call it](http://blog.niftysnippets.org/2008/04/you-must-remember-this.html).

# API #

The Lineage API is very simple: Two functions:

## `Lineage.define` ##

The main Lineage function: Defines a constructor with a prototype defined by the specification functions / objects you provide, using a given optional parent.

#### Arguments ####

  * `name` - (Optional string) A name for the constructor, if any; if not given, the constructor will be anonymous.
  * `parent` - (Optional function) The parent constructor, if any.
  * `...` - (Optional) Zero or more specification functions or objects:
    * A _specification function_ is a function that Lineage will call to define the prototype of the constructor. This is what nearly all of the examples in this documentation have used. The function's signature is: `function(p, pp, ctor, pctor)` where: `p` is the prototype of the newly-defined constructor function, `pp` is the prototype of the parent constructor (or `undefined` if none), `ctor` is the newly-defined constructor function, and `pctor` is the parent constructor function (or `undefined` if none). Normally, your code in this function adds properties the given prototype (`p`, the first argument) and doesn't return anything. Optionally, though, you can build your own object with items you want added to the prototype and return it; Lineage will copy its properties to the constructor's prototype.
    * A _specification object_ is just an object to use directly to define the properties for the prototype; all of the properties of the specification object (including inherited properties) are copied to the constructor's prototype.
> You can mix specification objects and specification functions as you wish.

#### Return Value ####

A reference to the generated constructor function.

#### Examples ####

##### Example 1: Theme and Variations #####

The following demonstrates the various options available for specification objects and functions. All of the following define exactly the same constructor and prototype **except** that where function expressions rather than declarations are used, the resulting functions have no names:

```
// Example 1.1: Uses a specification function, adds properties to
// the given specification object. Both the constructor function
// and the prototype functions have real names.
var Thing = Lineage.define("Thing", function(p) {

    p.spiffy = Thing_spiffy;
    function Thing_spiffy() {
    }

    p.cool = Thing_cool;
    function Thing_cool() {
    }
});

// Example 1.2: Uses a specification function, but uses anonymous
// functions -- this is just to demonstrate that you don't *have* to
// use named functions if you prefer not to.
var Thing = Lineage.define(function(p) {

    p.spiffy = function() {
    };

    p.cool = function() {
    };
});

// Example 1.3: Uses a specification function, but returns its own
// object rather than using the one passed in. Functions have real
// names (but you could do the anonymous thing if you liked).
var Thing = Lineage.define("Thing", function() {

    function Thing_spiffy() {
    }

    function Thing_cool() {
    }

    // Return an object with our prototype properties
    return {
        spiffy: Thing_spiffy,
        cool:   Thing_cool
    };
});

// Example 1.4: Uses a specification object, not function.
// As we have no scoping function, we end up using anonymous functions
// rather than functions with names.
var Thing = Lineage.define({

    spiffy: function() {
    },

    cool: function() {
    }
});
```

The first and second forms (Example 1.1 and 1.2) are the primary forms you'd normally use; which you use depends on whether you want named functions. Example 1.3 is just in case you already have an object you want to return, or you really like using object literals. There are several reasons to avoid the fourth form (Example 1.4), not least that you don't get access to the parent prototype (because Lineage has no function to pass it into), your functions end up being anonymous, and you have no handy scope for private functions and data (although of course, you may have the call to Lineage wrapped in a scoping function already).

##### Example 2: Hierarchy #####

Most of this we've seen before, but here's a complete implementation of a three-tier hierarchy where all functions have names:

```
var Thing = Lineage.define("Thing", function(p) {
    // Standard initialize, in this case accepting an argument
    p.initialize = Thing_initialize;
    function Thing_initialize(name) {
        this.name = name;
    }

    // Some spiffy function
    p.spiffy = Thing_spiffy;
    function Thing_spiffy(x) {
        console.log("Thing(" + this.name + ").spiffy(" + x + ")");
    }
});

var NiftyThing = Lineage.define("NiftyThing", Thing, function(p, pp) {
    // Standard initialize, chains to base
    p.initialize = NiftyThing_initialize;
    function NiftyThing_initialize(name) {
        pp.initialize.call(this, name);
    }

    // Overrides `spiffy`, chains to base
    p.spiffy = NiftyThing_spiffy;
    function NiftyThing_spiffy(x) {
        pp.spiffy.call(this, x);
        console.log("NiftyThing(" + this.name + ").spiffy(" + x + ")");
    }

    // Adds a new function
    p.added = NiftyThing_added;
    function NiftyThing_added(x) {
        console.log("NiftyThing(" + this.name + ").added(" + x + ")");
    }
});

var ReallyNiftyThing = Lineage.define("ReallyNiftyThing", NiftyThing, function(p, pp) {
    // Standard initialize, chains to base
    p.initialize = ReallyNiftyThing_initialize;
    function ReallyNiftyThing_initialize(name) {
        pp.initialize.call(this, name);
    }

    // Doesn't override `spiffy`

    // Overrides `added`
    p.added = ReallyNiftyThing_added;
    function ReallyNiftyThing_added(x) {
        pp.added.call(this, x);
        console.log("ReallyNiftyThing(" + this.name + ").added(" + x + ")");
    }
});
```

## `Lineage.noConflict` ##

Releases the `Lineage` global symbol, restoring any value it had prior to loading Lineage. This is for the _(fairly unlikely)_ scenario that you have code already using the global symbol `Lineage` and you want to avoid conflicting with it, or you simply prefer not to have any global symbols **at all** and do everything within a scoping function (good for you!).

#### Arguments ####

  * `callback` - An optional callback function. If supplied, when you call `Lineage.noConflict`, Lineage will call this function after restoring the previous global `Lineage` symbol. The function will receive a reference to Lineage as its only argument.

#### Return Value ####

A reference to the Lineage object, so you can assign it to a symbol to use it from.

#### Examples ####

##### Example 1: Using the `noConflict` return value #####

Here we use the return value of `Lineage.noConflict`:

```
<!-- A script that defines a Lineage symbol, however unlikely that may be -->
<script>
var Lineage = "foo";
</script>
<!-- lineage.js -->
<script src="lineage.js"></script>
<!-- Code using lineage.js -->
<script>
(function() {
    // Release the `Lineage` symbol, use `L` instead
    var L = Lineage.noConflict();
    console.log(Lineage); // Logs "foo"
    var Thing = L.define("Thing", function(p) {
        p.spiffy = Thing_spiffy;
        function Thing_spiffy() {
            // ...
        }
    });
    // ...
})();
</script>
```

##### Example 2: Using the `noConflict` callback #####

Here we use the callback:

```
<!-- A script that defines a Lineage symbol, however unlikely that may be -->
<script>
var Lineage = "foo";
</script>
<!-- lineage.js -->
<script src="lineage.js"></script>
<!-- Code using lineage.js -->
<script>
// Release the `Lineage` symbol, use `L` instead in the callback
Lineage.noConflict(function(L) {
    console.log(Lineage); // Logs "foo"
    var Thing = L.define("Thing", function(p) {
        p.spiffy = Thing_spiffy;
        function Thing_spiffy() {
            // ...
        }
    });
    // ...
});
</script>
```

# History #

**TBD.** Basically, in 2009 I found out how [Prototype's](http://prototypejs.org) `Class` system handled supercalls and was appalled by the inefficiency, so I came up with [a more efficient way to do them](http://blog.niftysnippets.org/2009/09/simple-efficient-supercalls-in.html) but the syntax, while trivial to the advanced JavaScript programmer, was daunting to those with a more casual knowledge of the language. Then, in 2012, I wanted to use my new system and decided to clean it up and create a project for it, and in the process of doing that a **dramatically** better way to do supercalls came to me. Thus was born Lineage.