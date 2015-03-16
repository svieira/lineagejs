

# Introduction #

This page shows examples of constructors defined using Lineage and using plain JavaScript, both to show how Lineage simplifies things and so experienced JavaScript programmers can readily see how to map plain constructs to Lineage.

# Examples #

## Example 1: Single Constructor with Two Anonymous Functions ##

### 1 - Plain JavaScript ###

```
function Thing(name) {
    this.name = name;
}
Thing.prototype.hi = function() {
    console.log("Hi, my name is " + this.name + ".");
};
Thing.prototype.bye = function() {
    console.log("Bye from " + this.name + "!");
};
```

### 1 - Lineage ###

```
var Thing = Lineage.define("Thing", {
    initialize: function(name) {
        this.name = name;
    },
    hi: function() {
        console.log("Hi, my name is " + this.name + ".");
    },
    bye: function() {
        console.log("Bye from " + this.name + "!");
    }
});
```

or

```
var Thing = Lineage.define("Thing", function(p) {
    p.initialize = function(name) {
        this.name = name;
    };
    p.hi = function() {
        console.log("Hi, my name is " + this.name + ".");
    };
    p.bye = function() {
        console.log("Bye from " + this.name + "!");
    };
});
```

### 1 - Observations ###

In this limited example, Lineage doesn't buy you much -- in fact, it's actually **less** concise because we need the `initialize` function. Any benefits would be subjective, around containing the definition in some kind of structure.

## Example 2: Single Constructor with Two Named Functions ##

### 2 - Plain JavaScript ###

```
var Thing = (function() {
    function Thing(name) {
        this.name = name;
    }
    var p = Thing.prototype;

    p.hi = hi;
    function hi() {
        console.log("Hi, my name is " + this.name + ".");
    }
    p.bye = bye;
    function bye() {
        console.log("Bye from " + this.name + "!");
    }
    return Thing;
})();
```

### 2 - Lineage ###

```
var Thing = Lineage.define("Thing", function(p) {
    p.initialize = initialize;
    function initialize(name) {
        this.name = name;
    }
    p.hi = hi;
    function hi() {
        console.log("Hi, my name is " + this.name + ".");
    }
    p.bye = bye;
    function bye() {
        console.log("Bye from " + this.name + "!");
    };
});
```

### 2 - Observations ###

Roughly the same either way. Again, **if** there are any benefits, they're subjective ones.

## Example 3: Two-Level Hierarchy with Named Functions ##

### 3 - Plain JavaScript ###

```
var Thing = (function() {
    var p;

    function Thing(name) {
        this.name = name;
    }
    p = Thing.prototype;

    p.one = one;
    function one() {
        console.log("Thing#one: name = " + this.name);
    }

    p.two = two;
    function two() {
        console.log("Thing#two: name = " + this.name);
    }

    p.three = three;
    function three() {
        console.log("Thing#three: name = " + this.name);
    }

    return Thing;
})();

var NiftyThing = (function(parent) {
    var proxy, p, pp;

    function NiftyThing(name) {
        parent.call(this, name);
    }
    proxy = function() { };
    proxy.prototype = parent.prototype;
    p = new proxy();
    // On ECMAScript5 systems, the three lines above could be
    // replaced with p = Object.create(parent.prototype);
    p.constructor = NiftyThing;
    NiftyThing.prototype = p;
    pp = parent.prototype;

    p.one = one;
    function one() {
        // Call parent
        pp.one.call(this);

        // And also do our own thing
        console.log("NiftyThing#one: name = " + this.name);
    }

    p.two = two;
    function two() {
        // Just do our own thing without calling parent
        console.log("NiftyThing#two: name = " + this.name);
    }

    // We don't override `three`

    return NiftyThing;
})(Thing);
```

Now we get into needing to supply the plumbing for inheritance. It's getting verbose, and if we have to do it a second time, repetitive. We have to create a function (called `proxy`) to generate the prototype for our child constructor, since we don't want to call the parent constructor as it expects to receive arguments. (On systems with <tt><a href='http://es5.github.com/#x15.2.3.5'>Object.create</a></tt>, we could save two lines of code there.) Then we have to put the parent prototype on the proxy, call it to create the child prototype, set the child prototype constructor correctly, and grab references to the child and parent prototypes for convenient use. We could tuck some of that away in a utility function, but of course, that's what Lineage is -- a utility toolkit.

### 3 - Lineage ###

```
var Thing = Lineage.define("Thing", function(p) {

    p.initialize = initialize;
    function initialize(name) {
        this.name = name;
    }

    p.one = one;
    function one() {
        console.log("Thing#one: name = " + this.name);
    }

    p.two = two;
    function two() {
        console.log("Thing#two: name = " + this.name);
    }

    p.three = three;
    function three() {
        console.log("Thing#three: name = " + this.name);
    }
});

var NiftyThing = Lineage.define("NiftyThing", Thing, function(p, pp) {

    p.initialize = initialize;
    function initialize(name) {
        pp.initialize.call(this, name);
    }

    p.one = one;
    function one() {
        // Call parent
        pp.one.call(this);

        // And also do our own thing
        console.log("NiftyThing#one: name = " + this.name);
    }

    p.two = two;
    function two() {
        // Just do our own thing without calling parent
        console.log("NiftyThing#two: name = " + this.name);
    }

    // We don't override `three`
});
```

### 3 - Observations ###

Lineage does the plumbing for us, the resulting code is shorter.

## Example 4: Three-Level Hierarchy with Named Functions ##

### 4 - Plain JavaScript ###

```
var Thing = (function() {
    var p;

    function Thing(name) {
        this.name = name;
    }
    p = Thing.prototype;

    p.one = one;
    function one() {
        console.log("Thing#one: name = " + this.name);
    }

    p.two = two;
    function two() {
        console.log("Thing#two: name = " + this.name);
    }

    p.three = three;
    function three() {
        console.log("Thing#three: name = " + this.name);
    }

    return Thing;
})();

var NiftyThing = (function(parent) {
    var proxy, p, pp;

    function NiftyThing(name) {
        parent.call(this, name);
    }
    proxy = function() { };
    proxy.prototype = parent.prototype;
    p = new proxy();
    p.constructor = NiftyThing;
    NiftyThing.prototype = p;
    pp = parent.prototype;

    p.one = one;
    function one() {
        // Call parent
        pp.one.call(this);

        // And also do our own thing
        console.log("NiftyThing#one: name = " + this.name);
    }

    p.two = two;
    function two() {
        // Just do our own thing without calling parent
        console.log("NiftyThing#two: name = " + this.name);
    }

    // We don't override `three`

    return NiftyThing;
})(Thing);

var ReallyNiftyThing = (function(parent) {
    var proxy, p, pp;

    function ReallyNiftyThing(name) {
        parent.call(this, name);
    }
    proxy = function() { };
    proxy.prototype = parent.prototype;
    p = new proxy();
    p.constructor = ReallyNiftyThing;
    ReallyNiftyThing.prototype = p;
    pp = parent.prototype;

    p.one = one;
    function one() {
        // Call parent
        pp.one.call(this);

        // And do our own thing
        console.log("ReallyNiftyThing#one: name = " + this.name);
    }

    // We don't override either `two` or `three`

    return ReallyNiftyThing;
})(NiftyThing);
```

Now we're really starting to see repeated blocks of boilerplate code; a classic case for putting things in a toolkit.

### 4 - Lineage ###

```
var Thing = Lineage.define("Thing", function(p) {

    p.initialize = initialize;
    function initialize(name) {
        this.name = name;
    }

    p.one = one;
    function one() {
        console.log("Thing#one: name = " + this.name);
    }

    p.two = two;
    function two() {
        console.log("Thing#two: name = " + this.name);
    }

    p.three = three;
    function three() {
        console.log("Thing#three: name = " + this.name);
    }
});

var NiftyThing = Lineage.define("NiftyThing", Thing, function(p, pp) {

    p.initialize = initialize;
    function initialize(name) {
        pp.initialize.call(this, name);
    }

    p.one = one;
    function one() {
        // Call parent
        pp.one.call(this);

        // And also do our own thing
        console.log("NiftyThing#one: name = " + this.name);
    }

    p.two = two;
    function two() {
        // Just do our own thing without calling parent
        console.log("NiftyThing#two: name = " + this.name);
    }

    // We don't override `three`
});

var ReallyNiftyThing = Lineage.define("ReallyNiftyThing", NiftyThing, function(p, pp) {

    p.initialize = initialize;
    function initialize(name) {
        pp.initialize.call(this, name);
    }

    p.one = one;
    function one() {
        // Call parent
        pp.one.call(this);

        // And do our own thing
        console.log("ReallyNiftyThing#one: name = " + this.name);
    }

    // We don't override either `two` or `three`
});
```

### 4 - Observations ###

Sure enough, we're now seeing significantly less boilerplate code and that's translating into fewer lines (nearly a quarter fewer), fewer characters, increased reliability (less retyping = fewer mistakse), increased flexibility (if we want to change the boilerplate), and (subjectively) increased clarity.

## Example 5: Three-Level Hierarchy with Anonymous Functions ##

But what if you don't care about functions having names, would the "plain" anonymous version be better? Let's find out:

### 5 - Plain JavaScript ###

```
var Thing = (function() {
    var p;

    function Thing(name) {
        this.name = name;
    }
    p = Thing.prototype;

    p.one = function() {
        console.log("Thing#one: name = " + this.name);
    };

    p.two = function() {
        console.log("Thing#two: name = " + this.name);
    };

    p.three = function() {
        console.log("Thing#three: name = " + this.name);
    };

    return Thing;
})();

var NiftyThing = (function(parent) {
    var proxy, p, pp;

    function NiftyThing(name) {
        parent.call(this, name);
    }
    proxy = function() { };
    proxy.prototype = parent.prototype;
    p = new proxy();
    p.constructor = NiftyThing;
    NiftyThing.prototype = p;
    pp = parent.prototype;

    p.one = function() {
        // Call parent
        pp.one.call(this);

        // And also do our own thing
        console.log("NiftyThing#one: name = " + this.name);
    };

    p.two = function() {
        // Just do our own thing without calling parent
        console.log("NiftyThing#two: name = " + this.name);
    };

    // We don't override `three`

    return NiftyThing;
})(Thing);

var ReallyNiftyThing = (function(parent) {
    var proxy, p, pp;

    function ReallyNiftyThing(name) {
        parent.call(this, name);
    }
    proxy = function() { };
    proxy.prototype = parent.prototype;
    p = new proxy();
    p.constructor = ReallyNiftyThing;
    ReallyNiftyThing.prototype = p;
    pp = parent.prototype;

    p.one = function() {
        // Call parent
        pp.one.call(this);

        // And do our own thing
        console.log("ReallyNiftyThing#one: name = " + this.name);
    };

    // We don't override either `two` or `three`

    return ReallyNiftyThing;
})(NiftyThing);
```

Very little changed there. A few lines shorter, but the boilerplate code is the same, and still has to be repeated.

### 5 - Lineage ###

```
var Thing = Lineage.define(function(p) {

    p.initialize = function(name) {
        this.name = name;
    };

    p.one = function() {
        console.log("Thing#one: name = " + this.name);
    };

    p.two = function() {
        console.log("Thing#two: name = " + this.name);
    };

    p.three = function() {
        console.log("Thing#three: name = " + this.name);
    };
});

var NiftyThing = Lineage.define(Thing, function(p, pp) {

    p.initialize = function(name) {
        pp.initialize.call(this, name);
    };

    p.one = function() {
        // Call parent
        pp.one.call(this);

        // And also do our own thing
        console.log("NiftyThing#one: name = " + this.name);
    };

    p.two = function() {
        // Just do our own thing without calling parent
        console.log("NiftyThing#two: name = " + this.name);
    };

    // We don't override `three`
});

var ReallyNiftyThing = Lineage.define(NiftyThing, function(p, pp) {

    p.initialize = function(name) {
        pp.initialize.call(this, name);
    };

    p.one = function() {
        // Call parent
        pp.one.call(this);

        // And do our own thing
        console.log("ReallyNiftyThing#one: name = " + this.name);
    };

    // We don't override either `two` or `three`
});
```

And similarly only small changes here as well.

### 5 - Observations ###

The advantages are the same as the version with named functions; making them anonymous didn't buy us anything. The Lineage code eliminates the repeated boilerplate with the same benefits in terms of code size, reliability, flexibility, and clarity.

# Conclusion #

Lineage does nothing for us that we can't do for ourselves. Of course not, it's written in JavaScript just like our own code is.

But using Lineage, we avoid repeated, error-prone boilerplate code, which translates into shorter code, increased reliability, increased flexibility, and increased clarity.