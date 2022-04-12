---
layout: post
title: Add Json Synonyms Mime Types in Rails
date: 2020-03-19 12:49 +0100
---
A spec like [JSON:API](https://jsonapi.org/format/#content-negotiation-servers) wants us to accept
Content-Type `application/vnd.api+json`. To make this work we need to register a [Mime::Type](https://api.rubyonrails.org/).

Of course in case of `application/vnd.api+json` we want this to work as if it was the standard `application/json` so preferably we make
this a synonym. If we take a look at the existing `Mime::Type`:
```bash
[2] pry(main)> Mime::Type.lookup('application/json')
=> #<Mime::Type:0x00007fd9c7f6d530
 @hash=-727503365037717188,
 @string="application/json",
 @symbol=:json,
 @synonyms=["text/x-json", "application/jsonrequest"]
```

We can see there are already synonyms, so how do we add a new one without overriding
the existing ones?

```ruby
# config/initializers/mime_type.rb
json_synonyms = Mime::Type.lookup('application/json')
                  .send(:synonyms)
                  .push('application/vnd.api+json')
Mime::Type.register 'application/json', :json, json_synonyms
```

Sadly we need to use [send](https://ruby-doc.org/core-2.7.0/Object.html#method-i-send) to gain access to a private method, but this is still
better than overriding all synonyms.

If we now lookup our new MIME type:
```bash
[5] pry(main)> Mime::Type.lookup('application/vnd.api+json')
=> #<Mime::Type:0x00007fd9c7f6d530
 @hash=-727503365037717188,
 @string="application/json",
 @symbol=:json,
 @synonyms=["text/x-json", "application/jsonrequest", "application/vnd.api+json"]>
 ```
