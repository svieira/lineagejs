# lineagejs

A simple layer over ES3 / ES5 style prototypes that makes `super` calls *easy* and yet *private*
(no `this._super` field on the prototype).

```javascript
var SubClass = Lineage.define(SuperClass, function Subclass$namespace(p, $super) {
  // p is your newly created prototype and $super is a reference to *SuperClass*'s prototype.
  p.someMethod = function Subclass$someMethod() {
    return $super.someMethod.call(this);
  };
});
```

Created by [TJ Crowder](https://github.com/tjcrowder) - forked from Google Code to preserve it.

Licenced under [CC By-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/).
