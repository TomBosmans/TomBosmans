---
layout: post
title: Executable module
date: 2020-01-12 17:41 +0100
---
Small classes that only do 1 thing are the best. They are easier to read, easier to test and overall less headaches :ok_hand:.
These small classes usually only have 1 public method that I like to call `execute`, although `call` is also a popular
name for it. These classes usually look like:

```rb
class Multiplier
  def initialize(param1, param2)
    @param1 = param1
    @param2 = param2
  end

  def execute
    param1 * param2
  end

  private

  attr_reader :param1, :param2
end

Multiplier.new(5, 6).execute # => 30
```

So you usually initialize to instantly execute/call your instance.
As we are very lazy people, we want to shorten this!

```rb
class Multiplier
  def initialize(param1, param2)
    @param1 = param1
    @param2 = param2
  end

  def execute
    param1 * param2
  end

  def self.execute(param1, param2)
    new(param1, param2).execute
  end

  private

  attr_reader :param1, :param2
end

Multiplier.execute(5, 6) # => 30
```

Perfect! Except now we have to write a class method for every such class we make...
What about extracting it into a reusable module? But not every class we want to execute
will have an `param1` and a `param2`, so we need to fix that first.

```rb
def self.execute(*params)
  new(*params).execute
end
```

For more info about `*`, the splat operator, you should check the ruby docs [here](https://ruby-doc.org/core-2.5.0/doc/syntax/calling_methods_rdoc.html#label-Array+to+Arguments+Conversion).

So how will this look with a module?
```rb
module Executable
  def execute(*params)
    new(*params).execute
  end
end

class Multiplier
  extend Executable

  def initialize(param1, param2)
    @param1 = param1
    @param2 = param2
  end

  def execute
    param1 * param2
  end

  private

  attr_reader :param1, :param2
end

Multiplier.execute(5, 6) # => 30
```
By extending our `Executable` module in our `Multiplier` class we add the `execute` method on
the `Multiplier` class level (same as `self.execute`).

Finally there is 1 more thing we could consider and that is [blocks](https://ruby-doc.org/core-2.5.0/doc/syntax/calling_methods_rdoc.html#label-Block+Argument).
In our initializer we don't want to do anything more than initializing, so we should pass the given block to our execute method
as that is where we actually execute our logic.

```rb
module Executable
  def execute(*params, &block)
    new(*params).execute(&block)
  end
end

class Multiplier
  extend Executable

  def initialize(param1, param2)
    @param1 = param1
    @param2 = param2
  end

  def execute
    result = param1 * param2
    result = yield(result) if block_given?
    result
  end

  private

  attr_reader :param1, :param2
end

Multiplier.execute(5, 6) { |result| result + 1 } # => 31
```

In this case you could just have done `Multiplier.execute(5, 6) + 1` or even just `5 * 6 + 1`.
But hey, this is way cooler isn't it? :sunglasses:.
